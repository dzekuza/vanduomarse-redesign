"use client";

import { WavesIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { CompactStepper } from "@/components/booking/stepper";
import { FilterChip } from "@/components/events/filter-chip";
import { SaunaSessionDialog } from "@/components/reservation/sauna-session-dialog";
import { closeSessionInfo, SessionInfoLink } from "@/components/reservation/session-info-link";
import type { SaunaPageData } from "@/lib/data/public-types";
import { UpsellPicker } from "@/components/booking/upsell-picker";
import { OptionGroupLabel } from "@/components/reservation/option-card";
import { hourlyStartHours, MAX_PEOPLE, pickForRow, sessionRows, type PirtisPlan, type SaunaPick, type SessionRow } from "@/lib/reservation";
import { dateKey } from "@/lib/sauna";
import { DateField } from "@/components/reservation/date-field";
import { SaunaServiceHourly, SaunaServicePeople } from "./sauna-service-hourly";
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

const TYPES: { id: Mode; title: string; hint: string }[] = [
  { id: "private", title: "Privati pirtis", hint: "Visa pirtis jūsų grupei" },
  { id: "session", title: "Pirties seansas", hint: "Vieta bendrame seanse" },
];

/** Type, date and time lead into the existing reservation plan. */
export function SaunaServiceBooking({
  data, days, date, plan, pick, people, busy, sessionId, onDate, onPick, onPeople, onRemove, onSelectedFocus,
}: SaunaServiceBookingProps) {
  const [mode, setMode] = useState<Mode | null>(() => sessionId ? "session" : null);
  const [venueId, setVenueId] = useState<string>();
  /** Length and pirtininkas asked before a time is chosen; once a time is picked they live in `pick`. */
  const [draft, setDraft] = useState<{ hours: number; masterId: string | null }>({ hours: 0, masterId: null });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dialogQuantity, setDialogQuantity] = useState<{ eventId: string; people: number }>();
  const venues = saunaServiceVenues(data);
  const hasSessions = data.events.length > 0 || data.programs.some((program) => program.active && program.kind === "session");
  const venue = venues.find(({ id }) => id === venueId);
  const sauna = data.saunas.find(({ id }) => id === venueId);
  const hourly = plan?.mode === "hourly" ? plan : null;
  const masterId = hourly ? pick.masterId : draft.masterId;
  const draftMaster = data.masters.find(({ id }) => id === masterId) ?? null;
  const wantedHours = hourly ? pick.hours : draft.hours;
  function setHours(hours: number) {
    if (!hourly) return setDraft((d) => ({ ...d, hours }));
    // A longer session may no longer fit after the chosen start: ask for the start again.
    onPick({ ...pick, hours, startHour: hours > hourly.maxHours ? null : pick.startHour });
  }
  function setMaster(next: string | null) {
    if (!hourly) return setDraft((d) => ({ ...d, masterId: next }));
    onPick({ ...pick, masterId: next });
  }
  const canPickDate = mode === "session" || (mode === "private" && Boolean(venue?.hasPrices));
  /** A private booking is by the hour: one row holding the day's free starts; length and pirtininkas follow the start. */
  const hourlyRow = (day: string): SessionRow[] => {
    if (!sauna) return [];
    const startHours = hourlyStartHours(data, sauna, day, [], hourly ? hourly.hours : Math.max(draft.hours, draftMaster?.minHours ?? 0));
    return [{
      key: `h-${sauna.id}`, mode: "private", time: "", title: sauna.name, label: "", description: "", rate: "", seats: "",
      maxPeople: sauna.rates.maxParty, blocked: startHours.length === 0, programId: null, eventId: null, startHours,
    }];
  };
  const rowsFor = (day: string) => mode === "session" ? sessionRows(data, day).filter((row) => row.mode === "session") : hourlyRow(day);
  const rows = date && canPickDate ? rowsFor(dateKey(date)) : [];
  const selectedRow = rows.find((row) => row.mode === "session" && row.eventId === pick.eventId);
  const time = plan?.mode === "hourly" && plan.startHour !== null ? `null:${plan.startHour}` : selectedRow?.key;
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
          {TYPES.filter(({ id }) => id === "private" || hasSessions).map(({ id, title, hint }) => (
            <FilterChip key={id} active={mode === id} onClick={() => {
              if (mode === id) return;
              setMode(id);
              setCalendarOpen(false);
              onRemove();
            }} className="min-h-16 min-w-0 flex-col items-start justify-center gap-1 px-3 py-2 text-left">
              <span className="font-bold">{title}</span>
              <span className={mode === id ? "text-dust/80" : "text-copy"}>{hint}</span>
            </FilterChip>
          ))}
        </div>
      </fieldset>
      {mode === "private" ? (
        <SaunaServicePrivateOptions venues={venues} venueId={venueId} disabled={busy}
          onVenue={(id) => {
            if (id === venueId) return;
            setVenueId(id);
            setCalendarOpen(false);
            onRemove();
          }}
        />
      ) : null}
      {mode === "private" && sauna?.rates && venue?.hasPrices ? (
        <SaunaServiceHourly sauna={sauna} masters={data.masters} day={date ? dateKey(date) : null} hours={wantedHours} onHours={setHours}
          masterId={masterId} onMaster={setMaster} disabled={busy} />
      ) : null}
      <DateField date={date} days={days} disabled={busy || !canPickDate} open={calendarOpen} onOpenChange={setCalendarOpen} onSelect={onDate}
        icons={(day) => {
          const available = rowsFor(dateKey(day)).some(({ blocked }) => !blocked);
          return [{ Icon: WavesIcon, on: available, label: available ? "Yra laisvų laikų" : "Laisvų laikų nėra" }];
        }}
      />
      <SaunaServiceTime rows={rows} value={time} busy={busy} dateSelected={Boolean(date) && canPickDate} onSelect={(row, hour) => {
        if (row.mode === "session") selectSession(row, 1);
        else onPick({ ...pick, programId: null, eventId: null, children: 0, saunaId: venueId ?? pick.saunaId, startHour: hour, hours: draft.hours, masterId: draft.masterId }, people);
      }} />
      {mode === "private" && sauna?.rates && venue?.hasPrices ? <SaunaServicePeople sauna={sauna} people={people} onPeople={onPeople} disabled={busy} /> : null}
      {hourly && hourly.upsells.length ? (
        <fieldset disabled={busy}>
          <OptionGroupLabel>Papildomai</OptionGroupLabel>
          <UpsellPicker upsells={hourly.upsells} quantities={hourly.extras} partySize={people} hours={hourly.hours}
            onChange={(id, qty) => onPick({ ...pick, extras: { ...hourly.extras, [id]: qty } })} />
        </fieldset>
      ) : null}
      {selectedRow?.eventId && plan?.mode === "session" ? (
        <div className="space-y-3">
          <p className="text-xs text-copy">{selectedRow.rate} · {selectedRow.seats}</p>
          <SessionInfoLink id={selectedRow.eventId} className="inline-flex min-h-11 items-center text-xs underline underline-offset-4 hover:text-rust">Daugiau informacijos</SessionInfoLink>
          <fieldset disabled={busy} className="space-y-3">
            <CompactStepper label="Vietų skaičius" min={1} max={maxPeople(selectedRow)} value={people} onChange={onPeople} editable />
            {plan.program?.pricing === "family" ? <CompactStepper label="Vaikų grupėje" min={0} max={people - 1} value={plan.children} onChange={(children) => onPick({ ...pick, children })} editable /> : null}
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
