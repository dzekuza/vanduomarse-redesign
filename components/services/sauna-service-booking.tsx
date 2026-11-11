"use client";

import { WavesIcon } from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import { Stepper } from "@/components/booking/stepper";
import { FilterChip } from "@/components/events/filter-chip";
import { availableDayDetails } from "@/components/reservation/available-day-details";
import { SaunaSessionDialog } from "@/components/reservation/sauna-session-dialog";
import { closeSessionInfo } from "@/components/reservation/session-info-link";
import type { SaunaPageData } from "@/lib/data/public-types";
import { MAX_PEOPLE, pickForRow, privateStarts, sessionRows, type PirtisPlan, type SaunaPick, type SessionRow } from "@/lib/reservation";
import { saunaHireEstimate, type HireDuration, type SaunaHireEstimate } from "@/lib/sauna-hire";
import { dateKey } from "@/lib/sauna";
import { SaunaGuestSlider } from "./sauna-guest-slider";
import { SaunaHireDuration } from "./sauna-hire-duration";
import { SaunaServicePrivateOptions, saunaServiceVenues, unhostedSaunaProgram } from "./sauna-service-options";
import { SaunaServiceTime } from "./sauna-service-time";
import { SaunaServiceSessions } from "./sauna-service-sessions";
import { saunaSessionDayDetails } from "./sauna-session-day-details";
import { DateField } from "@/components/reservation/date-field";

interface SaunaServiceBookingProps {
  data: SaunaPageData;
  days: Date[];
  date: Date | null;
  plan: PirtisPlan | null | undefined;
  pick: SaunaPick;
  people: number;
  busy: boolean;
  sessionId: string | null;
  mode?: Mode | null;
  busyOnDate?: (day: string) => readonly number[];
  onDate: (date: Date) => void;
  onPick: (pick: SaunaPick, people?: number) => void;
  onPeople: (people: number) => void;
  onRemove: () => void;
  onCheckout: () => void;
  renderBooking: (controls: ReactNode, estimate?: SaunaHireEstimate) => ReactNode;
}

type Mode = SessionRow["mode"];

const TYPES: { id: Mode; title: string }[] = [
  { id: "private", title: "Privati pirtis" },
  { id: "session", title: "Pirties seansas" },
];

/** Type, date and time lead into the existing reservation plan. */
export function SaunaServiceBooking({
  data, days, date, plan, pick, people, busy, sessionId, mode: controlledMode, busyOnDate,
  onDate, onPick, onPeople, onRemove, onCheckout, renderBooking,
}: SaunaServiceBookingProps) {
  const [localMode, setMode] = useState<Mode | null>(() => sessionId ? "session" : null);
  const mode = controlledMode === undefined ? localMode : controlledMode;
  const [venueId, setVenueId] = useState<string>();
  const [programId, setProgramId] = useState<string>();
  const [duration, setDuration] = useState<HireDuration>("2");
  const [guests, setGuests] = useState(1);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dialogQuantity, setDialogQuantity] = useState<{ eventId: string; people: number }>();
  const venues = saunaServiceVenues(data);
  const venue = venues.find(({ id }) => id === venueId);
  const sauna = data.saunas.find(({ id }) => id === venueId);
  const tariff = venue?.tariff;
  const program = venue?.programs.find(({ id }) => id === programId);
  const hosted = Boolean(tariff && programId === tariff.hostedProgram);
  const hireActive = mode === "private" && Boolean(tariff && program);
  const canPickDate = mode === "session" || (mode === "private" && Boolean(program));
  const rowsFor = (day: string) => {
    const busyHours = busyOnDate?.(day);
    const rows = sessionRows(data, day, busyHours).filter((row) =>
      mode === "session" ? row.mode === "session" : row.mode === "private" && row.programId === programId);
    if (!hireActive || !sauna || !program) return rows;
    const startHours = privateStarts(program, sauna, data, day, busyHours, duration);
    return rows.map((row) => ({ ...row, startHours, blocked: startHours.length === 0 }));
  };
  const selectedDay = date ? dateKey(date) : null;
  const estimate = hireActive && tariff && !plan
    ? saunaHireEstimate(tariff, duration, selectedDay, guests, hosted)
    : undefined;
  const rows = selectedDay && canPickDate ? rowsFor(selectedDay) : [];
  const selectedRow = plan?.mode === "session" ? rows.find((row) => row.eventId === plan.session?.key) : undefined;
  const time = plan?.mode === "private" ? plan.startHour : null;
  const event = data.events.find(({ key }) => key === sessionId);
  const eventDate = event && days.find((day) => dateKey(day) === event.date);
  const dialogRow = event && eventDate && sessionRows(data, event.date, busyOnDate?.(event.date)).find(({ eventId }) => eventId === event.key);
  const dialogSelected = Boolean(dialogRow && plan?.mode === "session" && dialogRow.eventId === pick.eventId);
  const maxPeople = (row: SessionRow) => Math.max(1, Math.min(row.maxPeople, MAX_PEOPLE));
  const dialogPeople = event && dialogQuantity?.eventId === event.key ? dialogQuantity.people : 1;

  function selectSession(row: SessionRow, count: number) {
    onPick(pickForRow(row, pick, null), count);
  }

  function selectDate(next: Date) {
    onDate(next);
    if (mode !== "session") return;
    const dayRows = rowsFor(dateKey(next));
    const [only] = dayRows;
    if (dayRows.length === 1 && !only.blocked && only.key !== selectedRow?.key) selectSession(only, 1);
  }

  function selectDuration(next: HireDuration) {
    if (next === duration) return;
    setDuration(next);
    if (!sauna || !program || plan?.mode !== "private" || plan.startHour === null || !selectedDay) return;
    if (privateStarts(program, sauna, data, selectedDay, busyOnDate?.(selectedDay), next).includes(plan.startHour)) {
      onPick({ ...pick, hireDuration: next }, guests);
    } else {
      onRemove();
    }
  }

  const controls = (
    <div className="space-y-5">
      {controlledMode === undefined ? <fieldset disabled={busy}>
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
      </fieldset> : null}
      {mode === "private" || (mode === null && controlledMode === undefined) ? (
        <SaunaServicePrivateOptions venues={venues} venueId={mode === "private" ? venueId : undefined}
          programId={programId} disabled={busy || mode !== "private"}
          durationField={mode === "private" && tariff ? (
            <SaunaHireDuration tariff={tariff} value={duration} day={selectedDay}
              hosted={hosted} disabled={busy} onChange={selectDuration} />
          ) : null}
          onVenue={(id) => {
            if (mode !== "private" || id === venueId) return;
            setVenueId(id);
            setProgramId(unhostedSaunaProgram(venues.find((venue) => venue.id === id))?.id);
            setGuests(1);
            setCalendarOpen(false);
            onRemove();
          }}
          onProgram={(id) => {
            if (id === programId) return;
            setProgramId(id);
            if (id === tariff?.hostedProgram && duration === "2") setDuration("3");
            onRemove();
          }}
        />
      ) : null}
      <DateField date={date} days={days} disabled={busy || !canPickDate} open={calendarOpen} onOpenChange={setCalendarOpen} onSelect={selectDate}
        dayDetails={(day) => {
          const dayRows = rowsFor(dateKey(day));
          return mode === "private"
            ? availableDayDetails(dayRows.some(({ blocked }) => !blocked))
            : saunaSessionDayDetails(dayRows);
        }}
      />
      {mode === "private" ? (
        <SaunaServiceTime startHours={rows[0]?.startHours ?? []} value={time} busy={busy} dateSelected={Boolean(date) && canPickDate} onSelect={(hour) => {
          const [row] = rows;
          if (row) onPick({ ...pickForRow(row, { ...pick, saunaId: venueId ?? pick.saunaId }, hour), hireDuration: hireActive ? duration : undefined }, hireActive ? guests : 1);
        }} />
      ) : null}
      {hireActive && tariff && sauna ? (
        <SaunaGuestSlider value={guests} max={sauna.rates.maxParty} tariff={tariff} disabled={busy} onChange={(count) => {
          setGuests(count);
          if (plan?.mode === "private") onPeople(count);
        }} />
      ) : null}
      {mode === "session" && date ? (
        <SaunaServiceSessions rows={rows} selectedKey={selectedRow?.key} busy={busy}
          quantity={selectedRow ? { value: people, max: maxPeople(selectedRow), onChange: onPeople } : undefined}
          familyControls={plan?.mode === "session" && plan.program?.pricing === "family" ? (
            <Stepper label="Vaikų grupėje" min={0} max={people - 1} value={plan.children} onChange={(children) => onPick({ ...pick, children })} editable compact />
          ) : undefined}
          onSelect={(row) => { if (row.key !== selectedRow?.key) selectSession(row, 1); }} />
      ) : null}
    </div>
  );

  return (
    <>
      {renderBooking(controls, estimate)}
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
        actionLabel="Rezervuoti"
        onConfirmedClose={onCheckout}
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
    </>
  );
}
