"use client";

import { WavesIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Stepper } from "@/components/booking/stepper";
import { FilterChip } from "@/components/events/filter-chip";
import { SaunaSessionDialog } from "@/components/reservation/sauna-session-dialog";
import { closeSessionInfo, SessionInfoLink } from "@/components/reservation/session-info-link";
import type { SaunaPageData } from "@/lib/data/public-types";
import { MAX_PEOPLE, pickForRow, sessionRows, type PirtisPlan, type SaunaPick, type SessionRow } from "@/lib/reservation";
import { dateKey } from "@/lib/sauna";
import { SaunaServiceDate } from "./sauna-service-date";
import { SaunaServicePrivateOptions, saunaServiceVenues } from "./sauna-service-options";
import { SaunaServiceTime } from "./sauna-service-time";

interface SaunaServiceBookingProps {
  data: SaunaPageData;
  days: Date[];
  date: Date | null;
  plan: PirtisPlan | null | undefined;
  pick: SaunaPick;
  people: number;
  busy: boolean;
  sessionId: string | null;
  onDate: (date: Date) => void;
  onPick: (pick: SaunaPick, people?: number) => void;
  onPeople: (people: number) => void;
  onRemove: () => void;
  onSelectedFocus: () => void;
}

type Mode = SessionRow["mode"];

const TYPES: { id: Mode; title: string }[] = [
  { id: "private", title: "Privati pirtis" },
  { id: "session", title: "Pirties seansas" },
];

/** Type, date and time lead into the existing reservation plan. */
export function SaunaServiceBooking({
  data, days, date, plan, pick, people, busy, sessionId, onDate, onPick, onPeople, onRemove, onSelectedFocus,
}: SaunaServiceBookingProps) {
  const [mode, setMode] = useState<Mode | null>(() => sessionId ? "session" : null);
  const [venueId, setVenueId] = useState<string>();
  const [programId, setProgramId] = useState<string>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dialogQuantity, setDialogQuantity] = useState<{ eventId: string; people: number }>();
  const venues = saunaServiceVenues(data);
  const canPickDate = mode === "session" || (mode === "private" && Boolean(programId));
  const rowsFor = (day: string) => sessionRows(data, day).filter((row) =>
    mode === "session" ? row.mode === "session" : row.mode === "private" && row.programId === programId);
  const rows = date && canPickDate ? rowsFor(dateKey(date)) : [];
  const selectedRow = rows.find((row) => row.mode === "session" && row.eventId === pick.eventId);
  const time = plan?.mode === "private" && plan.startHour !== null ? String(plan.startHour) : selectedRow?.key;
  const event = data.events.find(({ key }) => key === sessionId);
  const eventDate = event && days.find((day) => dateKey(day) === event.date);
  const dialogRow = event && eventDate && sessionRows(data, event.date).find(({ eventId }) => eventId === event.key);
  const dialogSelected = Boolean(dialogRow && plan?.mode === "session" && dialogRow.eventId === pick.eventId);
  const maxPeople = (row: SessionRow) => Math.max(1, Math.min(row.maxPeople, MAX_PEOPLE));
  const dialogPeople = event && dialogQuantity?.eventId === event.key ? dialogQuantity.people : 1;

  function selectSession(row: SessionRow, count: number) {
    onPick(pickForRow(row, pick, null), count);
  }

  return (
    <div className="space-y-5">
      <fieldset disabled={busy}>
        <legend className="mb-3 flex items-center gap-2 text-sm font-bold"><WavesIcon size={18} aria-hidden /> Tipas</legend>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map(({ id, title }) => (
            <FilterChip key={id} active={mode === id} onClick={() => {
              if (mode === id) return;
              setMode(id);
              setCalendarOpen(false);
              onRemove();
            }} className="min-w-0 justify-center px-2 py-2 text-center font-bold">
              {title}
            </FilterChip>
          ))}
        </div>
      </fieldset>
      {mode === "private" ? (
        <SaunaServicePrivateOptions venues={venues} venueId={venueId} programId={programId} disabled={busy}
          onVenue={(id) => {
            if (id === venueId) return;
            setVenueId(id);
            setProgramId(undefined);
            setCalendarOpen(false);
            onRemove();
          }}
          onProgram={(id) => {
            if (id === programId) return;
            setProgramId(id);
            onRemove();
          }}
        />
      ) : null}
      <SaunaServiceDate date={date} days={days} disabled={busy || !canPickDate} open={calendarOpen} onOpenChange={setCalendarOpen} onSelect={onDate}
        icons={(day) => {
          const available = rowsFor(dateKey(day)).some(({ blocked }) => !blocked);
          return [{ Icon: WavesIcon, on: available, label: available ? "Yra laisvų laikų" : "Laisvų laikų nėra" }];
        }}
      />
      <SaunaServiceTime rows={rows} value={time} busy={busy} dateSelected={Boolean(date) && canPickDate} onSelect={(row, hour) => {
        if (row.mode === "session") selectSession(row, 1);
        else onPick(pickForRow(row, { ...pick, saunaId: venueId ?? pick.saunaId }, hour), 1);
      }} />
      {selectedRow?.eventId && plan?.mode === "session" ? (
        <div className="space-y-3">
          <p className="text-xs text-copy">{selectedRow.rate} · {selectedRow.seats}</p>
          <SessionInfoLink id={selectedRow.eventId} className="inline-flex min-h-11 items-center text-xs underline underline-offset-4 hover:text-rust">Daugiau informacijos</SessionInfoLink>
          <fieldset disabled={busy} className="space-y-3">
            <Stepper label="Vietų skaičius" min={1} max={maxPeople(selectedRow)} value={people} onChange={onPeople} editable compact />
            {plan.program?.pricing === "family" ? <Stepper label="Vaikų grupėje" min={0} max={people - 1} value={plan.children} onChange={(children) => onPick({ ...pick, children })} editable compact /> : null}
          </fieldset>
        </div>
      ) : null}
      <SaunaSessionDialog
        open={Boolean(sessionId) && !busy}
        details={event && dialogRow ? {
          event, row: dialogRow, selected: dialogSelected,
          quantity: {
            value: dialogSelected ? people : dialogPeople,
            max: maxPeople(dialogRow),
            onChange: dialogSelected ? onPeople : (people) => setDialogQuantity({ eventId: event.key, people }),
          },
        } : undefined}
        onClose={closeSessionInfo}
        onSelectedFocus={onSelectedFocus}
        onSelect={() => {
          if (!dialogRow || dialogRow.blocked || !eventDate) return;
          if (!dialogSelected) {
            setMode("session");
            setCalendarOpen(false);
            onDate(eventDate);
            selectSession(dialogRow, dialogPeople);
          }
          closeSessionInfo();
        }}
      />
    </div>
  );
}
