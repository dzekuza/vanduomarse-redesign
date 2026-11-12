"use client";

import { CalendarBlankIcon, WavesIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { CompactStepper } from "@/components/booking/stepper";
import { FilterChip } from "@/components/events/filter-chip";
import { SaunaSessionDialog } from "@/components/reservation/sauna-session-dialog";
import { closeSessionInfo } from "@/components/reservation/session-info-link";
import type { SaunaPageData } from "@/lib/data/public-types";
import { UpsellPicker } from "@/components/booking/upsell-picker";
import { OptionGroupLabel } from "@/components/reservation/option-card";
import { hourlyStartHours, MAX_PEOPLE, pickForRow, sessionRows, type PirtisPlan, type SaunaPick, type SessionRow } from "@/lib/reservation";
import { dateKey, FULL_DAY_HOURS } from "@/lib/sauna";
import { DateField } from "@/components/reservation/date-field";
import { DatePicker } from "@/components/reservation/date-picker";
import { SaunaServiceHourly, SaunaServicePeople } from "./sauna-service-hourly";
import { SaunaServicePrivateOptions, saunaServiceVenues } from "./sauna-service-options";
import { SaunaServiceSessions } from "./sauna-service-sessions";
import { SaunaServiceTime } from "./sauna-service-time";
import { saunaSessionDayDetails } from "./sauna-session-day-details";

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
  onReserve: () => void;
  /** Chosen outside (the /rezervacija type chips); the form then hides its own type choice. Remount it (key) when this changes. */
  mode?: SaunaMode;
}

export type SaunaMode = SessionRow["mode"];
type Mode = SaunaMode;

/** Whether the venue offers shared sessions next to private hire. */
export const saunaHasSessions = (data: SaunaPageData) => data.events.length > 0 || data.programs.some((program) => program.active && program.kind === "session");

const TYPES: { id: Mode; title: string }[] = [
  { id: "private", title: "Privati pirtis" },
  { id: "session", title: "Pirties seansas" },
];

/** Type, date and time lead into the existing reservation plan. */
export function SaunaServiceBooking({
  data, days, date, plan, pick, people, busy, sessionId, onDate, onPick, onPeople, onRemove, onReserve, mode: lockedMode,
}: SaunaServiceBookingProps) {
  const [ownMode, setMode] = useState<Mode | null>(() => sessionId ? "session" : null);
  const mode = lockedMode ?? ownMode;
  const [venueId, setVenueId] = useState<string>();
  /** Length and pirtininkas asked before a time is chosen; once a time is picked they live in `pick`. */
  const [draft, setDraft] = useState<{ hours: number; masterId: string | null }>({ hours: 0, masterId: null });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dialogQuantity, setDialogQuantity] = useState<{ eventId: string; people: number }>();
  const venues = saunaServiceVenues(data);
  const hasSessions = saunaHasSessions(data);
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
    const startHours = hourlyStartHours(data, sauna, day, [], hourly ? (hourly.fullDay ? FULL_DAY_HOURS : Math.max(pick.hours, hourly.hours)) : Math.max(draft.hours, draftMaster?.minHours ?? 0));
    return [{
      key: `h-${sauna.id}`, mode: "private", time: "", title: sauna.name, label: "", description: "", rate: "", seats: "",
      maxPeople: sauna.rates.maxParty, blocked: startHours.length === 0, programId: null, eventId: null, startHours,
    }];
  };
  const rowsFor = (day: string) => mode === "session" ? sessionRows(data, day).filter((row) => row.mode === "session") : hourlyRow(day);
  const rows = date && canPickDate ? rowsFor(dateKey(date)) : [];
  const selectedRow = rows.find((row) => row.mode === "session" && row.eventId === pick.eventId);
  const event = data.events.find(({ key }) => key === sessionId);
  const eventDate = event && days.find((day) => dateKey(day) === event.date);
  const dialogRow = event && eventDate && sessionRows(data, event.date).find(({ eventId }) => eventId === event.key);
  const dialogSelected = Boolean(dialogRow && plan?.mode === "session" && dialogRow.eventId === pick.eventId);
  const maxPeople = (row: SessionRow) => Math.max(1, Math.min(row.maxPeople, MAX_PEOPLE));
  const dialogPeople = event && dialogQuantity?.eventId === event.key ? dialogQuantity.people : 1;

  function selectSession(row: SessionRow, count: number) {
    onPick(pickForRow(row, pick, null), count);
  }

  /** A day with a single free session picks it at once. */
  function chooseDate(next: Date) {
    onDate(next);
    if (mode !== "session") return;
    const free = sessionRows(data, dateKey(next)).filter((row) => row.mode === "session" && !row.blocked);
    if (free.length === 1) selectSession(free[0], 1);
  }

  function dayDetails(day: Date, view: "strip" | "calendar") {
    const key = dateKey(day);
    const dayRows = rowsFor(key);
    const onInk = Boolean(lockedMode && canPickDate && view === "strip" && date && dateKey(date) === key);
    if (mode === "session") return saunaSessionDayDetails(dayRows, onInk);

    const free = dayRows[0]?.startHours?.length ?? 0;
    const available = sauna ? free > 0 : data.saunas.some((candidate) =>
      candidate.active && hourlyStartHours(data, candidate, key).length > 0,
    );
    const label = available ? "Laisva" : "Pilna";
    const color = onInk
      ? available ? "text-availability-open-on-ink" : "text-rust"
      : available ? "text-availability-open" : "text-rust-ink";
    return {
      label: sauna && available ? `Laisvų laikų: ${free}` : label,
      available,
      indicator: (
        <span className="@container mx-auto block w-6">
          <span className={`relative left-1/2 block w-max -translate-x-1/2 text-calendar-status font-bold ${color}`}>{label}</span>
        </span>
      ),
    };
  }

  return (
    <div className="space-y-5">
      {lockedMode ? null : <fieldset disabled={busy}>
        <legend className="mb-3 flex items-center gap-2 text-sm font-bold"><WavesIcon size={18} aria-hidden /> Tipas</legend>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.filter(({ id }) => id === "private" || hasSessions).map(({ id, title }) => (
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
      </fieldset>}
      {mode !== "session" && venues.length > 0 ? (
        <SaunaServicePrivateOptions venues={venues} venueId={venueId} disabled={busy || mode === null}
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
      {lockedMode ? (
        <fieldset disabled={busy || !canPickDate} className="min-w-0 disabled:opacity-50">
          <legend className="sr-only">Data</legend>
          <DatePicker
            compact
            wideStrip
            label={<span aria-hidden className="flex items-center gap-2 text-sm font-bold"><CalendarBlankIcon size={18} /> Data</span>}
            days={days}
            selected={canPickDate ? date : null}
            dayDetails={dayDetails}
            onSelect={chooseDate}
          />
        </fieldset>
      ) : (
        <DateField date={date} days={days} disabled={busy || !canPickDate} open={calendarOpen} onOpenChange={setCalendarOpen} onSelect={chooseDate}
          dayDetails={dayDetails}
        />
      )}
      {mode === "session" && date ? (
        <SaunaServiceSessions rows={rows} selectedKey={selectedRow?.key} busy={busy} onSelect={(row) => selectSession(row, 1)}
          quantity={selectedRow && plan?.mode === "session" ? { value: people, max: maxPeople(selectedRow), onChange: onPeople } : undefined}
          familyControls={plan?.mode === "session" && plan.program?.pricing === "family"
            ? <CompactStepper label="Vaikų grupėje" min={0} max={people - 1} value={plan.children} onChange={(children) => onPick({ ...pick, children })} editable />
            : null} />
      ) : date && canPickDate ? (
        <SaunaServiceTime
          hours={rows[0]?.startHours ?? []}
          selected={hourly?.startHour ?? null}
          busy={busy}
          onSelect={(startHour) => onPick({
            ...pick,
            programId: null,
            eventId: null,
            children: 0,
            saunaId: venueId ?? pick.saunaId,
            startHour,
            hours: wantedHours,
            masterId,
          }, people)}
        />
      ) : null}
      {mode === "private" && hourly?.startHour != null && sauna ? <SaunaServicePeople sauna={sauna} people={people} onPeople={onPeople} disabled={busy} /> : null}
      {hourly && hourly.upsells.length ? (
        <fieldset disabled={busy}>
          <OptionGroupLabel>Papildomai</OptionGroupLabel>
          <UpsellPicker upsells={hourly.upsells} quantities={hourly.extras} partySize={people} hours={hourly.hours}
            onChange={(id, qty) => onPick({ ...pick, extras: { ...hourly.extras, [id]: qty } })} />
        </fieldset>
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
        actionLabel="Rezervuoti"
        onSelectedFocus={onReserve}
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
