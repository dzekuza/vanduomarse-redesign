/**
 * The combined /rezervacija flow: one date and group size, then any mix of
 * sauna, quads and a stay; sauna and quads each take their own start time. Each activity is planned with the same pure
 * rules as its own booking page (`lib/sauna.ts`, `lib/quads.ts`, `lib/cabin.ts`);
 * the database re-prices and re-checks every request on submit.
 */
import {
  CABIN_SIZES,
  MAX_STAY_NIGHTS,
  MAX_STAY_UNITS,
  freeStayUnits,
  roomLabel,
  roomPrice,
  type CabinSize,
  type RoomTypeId,
  type StayUnitType,
} from "@/lib/cabin";
import type { CabinPageData, QuadPageData, SaunaPageData } from "@/lib/data/public-types";
import { MAX_QUAD_RENTAL_UNITS, fleetRentalPrice, freeAt, hourLabel, longestForFleet, type QuadRentalItem } from "@/lib/quads";
import {
  formatHour,
  hoursLabel,
  isOpenStart,
  maxHoursFrom,
  longDateLabel,
  nextDays,
  pastHourOn,
  sessionPrice,
  type Sauna,
} from "@/lib/sauna";
import type { SaunaEventData } from "@/lib/sauna-events";
import { durationLabel, programRateLine, programTotal, type SaunaProgram } from "@/lib/sauna-programs";
import { upsellMax, upsellSummary, upsellTotal, type Upsell } from "@/lib/sauna-upsells";

export type ActivityId = "pirtis" | "keturraciai" | "nakvyne";

export const ACTIVITY_ORDER: ActivityId[] = ["pirtis", "keturraciai", "nakvyne"];

/** Order of the activity tabs on /rezervacija. */
export const ACTIVITY_TAB_ORDER: ActivityId[] = ["pirtis", "nakvyne", "keturraciai"];

export const ACTIVITY_TITLE: Record<ActivityId, string> = {
  pirtis: "Pirtis",
  keturraciai: "Keturračiai",
  nakvyne: "Nakvynė",
};

/** Check-in and activity dates shown on /rezervacija, including today. */
export const RESERVATION_DAYS = 60;
export const MAX_PEOPLE = 20;

export interface ReservationData {
  sauna: SaunaPageData;
  cabin: CabinPageData;
  quads: QuadPageData;
}

/** What step 1 fixes for every activity. */
export interface When {
  /** yyyy-mm-dd */
  day: string;
  people: number;
}

export interface SaunaPick {
  /** A linked sauna program, if this option uses one. */
  programId: string | null;
  /** Session programs: the scheduled session (event id) picked for the day. */
  eventId: string | null;
  /** Family program: children in the group (the rest are adults). */
  children: number;
  saunaId: string;
  /** null until the visitor picks a start. */
  startHour: number | null;
  hours: number;
  /** Upsell id -> item count (counted extras) or 1 (on/off extras). */
  extras: Record<string, number>;
}
export interface QuadPick {
  quantities: Record<string, number>;
  startHour: number | null;
  hours: number;
}
export interface StayPick {
  roomId: RoomTypeId;
  size: CabinSize;
  nights: number;
  units: number;
}
export interface Picks {
  pirtis?: SaunaPick;
  keturraciai?: QuadPick;
  nakvyne?: StayPick;
}

export interface SaunaPlan {
  kind: "pirtis";
  mode: "hourly";
  sauna: Sauna;
  upsells: Upsell[];
  startHour: number | null;
  hours: number;
  extras: Record<string, number>;
  /** Longest session from the chosen start; 0 when the start is not bookable. */
  maxHours: number;
  ok: boolean;
  price: number;
}
/** A sauna program: a scheduled session or a flat-price private booking. */
interface ProgramPlanDetails {
  kind: "pirtis";
  /** Private programs: the sauna they occupy. */
  sauna: Sauna | null;
  startHour: number | null;
  /** Length in hours (can be fractional for sessions). */
  hours: number;
  adults: number;
  children: number;
  ok: boolean;
  price: number;
}
export type ProgramPlan = ProgramPlanDetails & (
  | { mode: "session"; program: SaunaProgram | null; session: SaunaEventData | null }
  | { mode: "private"; program: SaunaProgram }
);
export type PirtisPlan = SaunaPlan | ProgramPlan;

export interface QuadPlan extends QuadPick {
  kind: "keturraciai";
  items: QuadRentalItem[];
  units: number;
  maxHours: number;
  ok: boolean;
  price: number;
}
export interface StayPlan extends StayPick {
  kind: "nakvyne";
  /** Free units of a type for the whole stay. */
  free: (type: StayUnitType) => number;
  ok: boolean;
  price: number;
}
export interface Plans {
  pirtis?: PirtisPlan | null;
  keturraciai?: QuadPlan | null;
  nakvyne?: StayPlan | null;
}

export interface PlanLine {
  id: ActivityId;
  title: string;
  detail: string;
  schedule: string;
  price: number;
}

/** Which activities have anything to book right now. */
export function offered(data: ReservationData): Record<ActivityId, boolean> {
  return { pirtis: data.sauna.saunas.length > 0, keturraciai: data.quads.types.some((t) => t.units > 0), nakvyne: true };
}

export function defaultPick<K extends ActivityId>(id: K, data: ReservationData): NonNullable<Picks[K]>;
export function defaultPick(id: ActivityId, data: ReservationData): SaunaPick | QuadPick | StayPick {
  if (id === "pirtis") {
    const sauna = data.sauna.saunas[0];
    const first = data.sauna.programs[0];
    return { programId: first?.id ?? null, eventId: null, children: 0, saunaId: sauna?.id ?? "", startHour: null, hours: sauna?.rates.minHours ?? 2, extras: {} };
  }
  if (id === "keturraciai") return { quantities: {}, startHour: null, hours: 1 };
  return { roomId: "namelis", size: CABIN_SIZES[0].id, nights: 1, units: 1 };
}

/** Whole hours `[start, start + hours)` of a private program are free, open and not past. */
export function programStartOpen(sauna: Sauna, hours: number, taken: readonly number[], pastHour: number, start: number): boolean {
  const { rates } = sauna;
  if (start <= pastHour || start < rates.openHour || start + hours > rates.closeHour) return false;
  return spanHours(start * 60, hours * 60).every((h) => !taken.includes(h));
}

/** Start hours a private program can be offered at, before availability. */
export function programStartHours(sauna: Sauna, hours: number): number[] {
  const { openHour, closeHour } = sauna.rates;
  return Array.from({ length: Math.max(0, closeHour - Math.ceil(hours) - openHour + 1) }, (_, i) => openHour + i);
}

const startMinute = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const clock = (minute: number) => `${String(Math.floor(minute / 60) % 24).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

/** Whole hours touched by a half-open interval. */
const spanHours = (start: number, minutes: number) =>
  Array.from({ length: Math.max(0, Math.ceil((start + minutes) / 60) - Math.floor(start / 60)) }, (_, i) => Math.floor(start / 60) + i);

function sessionMinutes(event: SaunaEventData, program?: SaunaProgram | null): number {
  return event.minutes ?? program?.durationMinutes ?? 60;
}

/** Public sessions occupy the main sauna even when every ticket is sold. */
function saunaTaken(data: SaunaPageData, saunaId: string, day: string): number[] {
  const taken = data.takenBySauna[saunaId]?.[day] ?? [];
  if (saunaId !== "pirtis-marse") return taken;

  // Also account for events in the public payload while the availability RPC is being upgraded.
  const sessionHours = data.events.flatMap((event) => {
    const minutes = sessionMinutes(event, data.programs.find((program) => program.id === event.programId));
    const start = startMinute(event.time);
    if (event.date === day) return spanHours(start, minutes).filter((hour) => hour < 24);
    const daysSinceStart = Math.round((Date.parse(day) - Date.parse(event.date)) / 86400000);
    if (daysSinceStart < 1 || start + minutes <= daysSinceStart * 1440) return [];
    return spanHours(0, Math.min(1440, start + minutes - daysSinceStart * 1440));
  });
  return [...taken, ...sessionHours];
}

/** Hours a plan occupies, for keeping sauna and quads from overlapping. */
export function planHours(plan: PirtisPlan | QuadPlan | StayPlan | null | undefined): number[] {
  if (!plan || plan.kind === "nakvyne" || plan.startHour === null) return [];
  const start = plan.kind === "pirtis" && plan.mode === "session" && plan.session
    ? startMinute(plan.session.time)
    : plan.startHour * 60;
  return spanHours(start, plan.hours * 60);
}

function planSession(pick: SaunaPick, program: SaunaProgram | null, data: SaunaPageData, when: When, busy: readonly number[]): ProgramPlan {
  const session = data.events.find((e) => e.key === pick.eventId && e.programId === (program?.id ?? null) && e.date === when.day) ?? null;
  const children = program?.pricing === "family" ? Math.max(0, Math.min(pick.children, when.people - 1)) : 0;
  const adults = when.people - children;
  const minutes = session ? sessionMinutes(session, program) : (program?.durationMinutes ?? 60);
  const start = session ? startMinute(session.time) : null;
  const ok = session !== null && start !== null && start / 60 >= pastHourOn(when.day, data.today, data.nowHour) + 1
    && session.spotsLeft >= when.people && !spanHours(start, minutes).some((h) => busy.includes(h));
  return {
    kind: "pirtis", mode: "session", program, session, sauna: null,
    startHour: start === null ? null : Math.floor(start / 60), hours: minutes / 60, adults, children, ok,
    price: ok ? (program ? programTotal(program, adults, children) : session.pricePerPerson * adults) : 0,
  };
}

function planPrivate(pick: SaunaPick, program: SaunaProgram, data: SaunaPageData, when: When, busy: readonly number[]): ProgramPlan {
  const sauna = data.saunas.find((s) => s.id === program.saunaId) ?? null;
  const hours = program.durationMinutes / 60;
  const start = pick.startHour;
  const fits = sauna !== null && when.people <= Math.min(program.capacity ?? 0, sauna.rates.maxParty);
  const ok = fits && start !== null && programStartOpen(sauna, hours, [...saunaTaken(data, sauna.id, when.day), ...busy], pastHourOn(when.day, data.today, data.nowHour), start);
  return {
    kind: "pirtis", mode: "private", program, sauna, startHour: start, hours,
    adults: when.people, children: 0, ok, price: ok ? program.price : 0,
  };
}

/** A public session or a private program with all its available starts. */
export interface SessionRow {
  key: string;
  mode: "session" | "private";
  time: string;
  title: string;
  label: string;
  description: string;
  rate: string;
  seats: string;
  maxPeople: number;
  blocked: boolean;
  programId: string | null;
  eventId: string | null;
  host?: string;
  startHours?: number[];
}

function privateStarts(program: SaunaProgram, sauna: Sauna, data: SaunaPageData, day: string, busy: readonly number[] = []): number[] {
  const hours = program.durationMinutes / 60;
  const taken = [...saunaTaken(data, sauna.id, day), ...busy];
  const past = pastHourOn(day, data.today, data.nowHour);
  return programStartHours(sauna, hours).filter((start) => programStartOpen(sauna, hours, taken, past, start));
}

/** Published sessions first, followed by one card per private program. */
export function sessionRows(data: SaunaPageData, day: string, busy: readonly number[] = []): SessionRow[] {
  const rows: SessionRow[] = [];
  const past = pastHourOn(day, data.today, data.nowHour);
  const events = data.events.filter((event) => event.date === day).sort((a, b) => a.time.localeCompare(b.time));
  for (const event of events) {
    const start = startMinute(event.time);
    if (start / 60 < past + 1) continue;
    const program = data.programs.find((p) => p.id === event.programId && p.kind === "session");
    if (event.programId && !program) continue;
    const minutes = sessionMinutes(event, program);
    const overlaps = spanHours(start, minutes).some((hour) => busy.includes(hour));
    rows.push({
      key: `s-${event.key}`, mode: "session", time: `${event.time}–${clock(start + minutes)}`,
      title: event.title, label: program?.label ?? "Seansas", description: event.blurb,
      rate: program ? programRateLine(program) : `${event.pricePerPerson.toLocaleString("lt-LT")} € / asm.`,
      seats: overlaps ? "Kertasi su jūsų planu" : `Liko vietų: ${event.spotsLeft}${event.capacity ? `/${event.capacity}` : ""}`,
      maxPeople: event.spotsLeft, programId: event.programId, eventId: event.key,
      host: event.hostName, blocked: overlaps || event.spotsLeft < 1,
    });
  }

  for (const program of data.programs) {
    if (program.kind !== "private") continue;
    const sauna = data.saunas.find((s) => s.id === program.saunaId);
    if (!sauna) continue;
    const maxPeople = Math.min(program.capacity ?? 0, sauna.rates.maxParty);
    if (maxPeople < 1) continue;
    const startHours = privateStarts(program, sauna, data, day, busy);
    rows.push({
      key: `p-${program.id}`, mode: "private", time: durationLabel(program.durationMinutes),
      title: program.name, label: program.label, description: program.description, rate: programRateLine(program),
      seats: `Visa pirtis, iki ${maxPeople} žm.`, maxPeople, programId: program.id, eventId: null,
      startHours, blocked: startHours.length === 0,
    });
  }
  return rows;
}

export function rowSelected(row: SessionRow, plan: PirtisPlan): boolean {
  if (plan.mode === "hourly") return false;
  if (plan.mode === "session") return row.mode === "session" && plan.session?.key === row.eventId;
  return row.mode === "private" && plan.program.id === row.programId;
}

export function pickForRow(row: SessionRow, pick: SaunaPick, startHour: number | null): SaunaPick {
  return { ...pick, programId: row.programId, eventId: row.eventId, children: 0, startHour };
}

/** The pick that produced a plan, so a card can change one field of it. */
export function pickFromPlan(plan: PirtisPlan, data: SaunaPageData): SaunaPick {
  const first = data.saunas[0];
  if (plan.mode === "hourly") {
    return { programId: null, eventId: null, children: 0, saunaId: plan.sauna.id, startHour: plan.startHour, hours: plan.hours, extras: plan.extras };
  }
  return {
    programId: plan.program?.id ?? null,
    eventId: plan.mode === "session" ? plan.session?.key ?? null : null,
    children: plan.children,
    saunaId: first?.id ?? "",
    startHour: plan.mode === "private" ? plan.startHour : null,
    hours: first?.rates.minHours ?? 2,
    extras: {},
  };
}

export function planSauna(pick: SaunaPick, data: SaunaPageData, when: When, busy: readonly number[] = []): PirtisPlan | null {
  const program = pick.programId ? (data.programs.find((p) => p.id === pick.programId) ?? null) : null;
  if (pick.programId && !program) return null;
  if (program?.kind === "session" || (!program && pick.eventId)) return planSession(pick, program, data, when, busy);
  if (program?.kind === "private") return planPrivate(pick, program, data, when, busy);
  return planHourly(pick, data, when, busy);
}

function planHourly(pick: SaunaPick, data: SaunaPageData, when: When, busy: readonly number[]): SaunaPlan | null {
  const sauna = data.saunas.find((s) => s.id === pick.saunaId) ?? data.saunas[0];
  if (!sauna) return null;
  const { rates } = sauna;
  const taken = [...saunaTaken(data, sauna.id, when.day), ...busy];
  const start = pick.startHour;
  const ok =
    start !== null &&
    when.people <= rates.maxParty &&
    start >= rates.openHour &&
    isOpenStart(taken, start, rates, pastHourOn(when.day, data.today, data.nowHour));
  const maxHours = ok ? maxHoursFrom(taken, start, rates) : 0;
  const hours = Math.min(Math.max(pick.hours, rates.minHours), Math.max(maxHours, rates.minHours));
  const upsells = data.upsells.filter((u) => sauna.upsellIds.includes(u.id));
  const extras: Record<string, number> = {};
  for (const u of upsells) {
    const qty = Math.min(pick.extras[u.id] ?? 0, u.unit === "vienetui" ? upsellMax(u, when.people) : 1);
    if (qty > 0) extras[u.id] = qty;
  }
  const extrasPrice = upsells.reduce((sum, u) => sum + upsellTotal(u, extras[u.id] ?? 0, { partySize: when.people, hours }), 0);
  return { kind: "pirtis", mode: "hourly", sauna, upsells, startHour: start, hours, extras, maxHours, ok, price: ok ? sessionPrice(hours, when.people, rates) + extrasPrice : 0 };
}

export function planQuads(pick: QuadPick, data: QuadPageData, day: string, busy: readonly number[] = []): QuadPlan {
  const items = data.types.flatMap((type) => {
    const units = pick.quantities[type.id] ?? 0;
    return units > 0 ? [{ type, units }] : [];
  });
  const units = items.reduce((total, item) => total + item.units, 0);
  const { settings, taken, today, nowHour } = data;
  const { startHour } = pick;
  const validStart = startHour !== null && startHour >= settings.openHour && startHour > pastHourOn(day, today, nowHour);
  const maxHours = validStart ? longestForFleet(items, taken, day, startHour, settings, busy) : 0;
  const hours = Math.max(1, Math.min(pick.hours, maxHours));
  const ok = maxHours > 0 && units <= MAX_QUAD_RENTAL_UNITS;
  return { ...pick, kind: "keturraciai", items, units, maxHours, hours, ok, price: ok ? fleetRentalPrice(items, hours) : 0 };
}

export function planStay(pick: StayPick, data: CabinPageData, day: string): StayPlan {
  const { roomId, size, nights, units } = pick;
  const checkIn = nextDays(day, 1)[0];
  const free = (type: StayUnitType) => freeStayUnits(data.availability, checkIn, nights, type);
  const validNights = Number.isInteger(nights) && nights >= 1 && nights <= MAX_STAY_NIGHTS;
  const ok = validNights && Number.isInteger(units) && units >= 1 && units <= Math.min(MAX_STAY_UNITS, free(roomId === "namelis" ? size : roomId));
  return { ...pick, kind: "nakvyne", free, ok, price: ok ? roomPrice(roomId, size) * nights * units : 0 };
}

/**
 * Whether a session can host `people`, a private sauna or quad is free, or a stay is available for `nights` from `day`.
 */
export function dayAvailability(data: ReservationData, day: string, people: number, nights = 1): Record<ActivityId, boolean> {
  const past = pastHourOn(day, data.sauna.today, data.sauna.nowHour);
  const sessionOpen = data.sauna.events.some((event) => event.date === day && event.spotsLeft >= people
    && startMinute(event.time) / 60 >= past + 1
    && (!event.programId || data.sauna.programs.some((p) => p.id === event.programId && p.kind === "session")));
  const privateOpen = data.sauna.programs.some((program) => {
    if (program.kind !== "private") return false;
    const sauna = data.sauna.saunas.find((s) => s.id === program.saunaId);
    return sauna && Math.min(program.capacity ?? 0, sauna.rates.maxParty) > 0
      && privateStarts(program, sauna, data.sauna, day).length > 0;
  });
  const { settings, types, taken } = data.quads;
  let keturraciai = false;
  for (let h = Math.max(settings.openHour, past + 1); h < settings.closeHour; h++) {
    if (types.some((type) => freeAt(type, taken, day, h) > 0)) {
      keturraciai = true;
      break;
    }
  }
  const checkIn = nextDays(day, 1)[0];
  const hasStay = (type: StayUnitType) => freeStayUnits(data.cabin.availability, checkIn, nights, type) > 0;
  const nakvyne = hasStay("kemperis") || CABIN_SIZES.some(({ id }) => hasStay(id));
  return { pirtis: sessionOpen || privateOpen, keturraciai, nakvyne };
}

export function planAll(picks: Picks, data: ReservationData, when: When): Plans {
  // First plan each without the other, then keep the sauna and the quads from overlapping in time.
  const sauna = picks.pirtis ? planSauna(picks.pirtis, data.sauna, when) : undefined;
  const quads = picks.keturraciai ? planQuads(picks.keturraciai, data.quads, when.day) : undefined;
  return {
    pirtis: picks.pirtis ? planSauna(picks.pirtis, data.sauna, when, planHours(quads)) : undefined,
    keturraciai: picks.keturraciai ? planQuads(picks.keturraciai, data.quads, when.day, planHours(sauna)) : undefined,
    nakvyne: picks.nakvyne ? planStay(picks.nakvyne, data.cabin, when.day) : undefined,
  };
}

/** Plans the visitor picked (null = picked but nothing to book). */
export function chosen(plans: Plans): ActivityId[] {
  return ACTIVITY_ORDER.filter((id) => plans[id] !== undefined);
}

/** At least one activity picked and every picked one is bookable at this time. */
export function bookable(plans: Plans): boolean {
  const ids = chosen(plans);
  return ids.length > 0 && ids.every((id) => plans[id]?.ok);
}

export function describePlans(plans: Plans, when: When): PlanLine[] {
  const lines: PlanLine[] = [];
  const { pirtis, keturraciai, nakvyne } = plans;
  const dayLabel = longDateLabel(nextDays(when.day, 1)[0]);
  if (keturraciai) {
    const time = keturraciai.startHour === null ? "Pasirink laiką" : `${hourLabel(keturraciai.startHour)}-${hourLabel(keturraciai.startHour + keturraciai.hours)}`;
    const quantities = keturraciai.items.map(({ type, units }) => `${units} × ${type.name}`);
    lines.push({ id: "keturraciai", title: "Keturračiai", detail: quantities.join(", "), schedule: `${dayLabel}, ${time}`, price: keturraciai.price });
  }
  if (pirtis?.mode === "hourly") {
    const extras = upsellSummary(pirtis.upsells, pirtis.extras);
    const time = pirtis.startHour === null ? "Pasirink laiką" : `${formatHour(pirtis.startHour)}-${formatHour(pirtis.startHour + pirtis.hours)}`;
    lines.push({ id: "pirtis", title: pirtis.sauna.name.startsWith("Pirtis") ? pirtis.sauna.name : `Pirtis · ${pirtis.sauna.name}`, detail: [hoursLabel(pirtis.hours), ...extras].join(", "), schedule: `${dayLabel}, ${time}`, price: pirtis.price });
  } else if (pirtis) {
    const who = `${pirtis.adults} ${pirtis.children ? "suaug." : "žm."}${pirtis.children ? ` + ${pirtis.children} vaik.` : ""}`;
    const start = pirtis.mode === "session" && pirtis.session ? startMinute(pirtis.session.time) : (pirtis.startHour ?? 0) * 60;
    const time = pirtis.startHour === null ? "Pasirink laiką" : `${clock(start)}–${clock(start + pirtis.hours * 60)}`;
    const title = (pirtis.mode === "session" ? pirtis.session?.title : pirtis.program.name) ?? pirtis.program?.name ?? "Pirties seansas";
    const date = pirtis.mode === "session" && pirtis.session ? longDateLabel(nextDays(pirtis.session.date, 1)[0]) : dayLabel;
    lines.push({ id: "pirtis", title, detail: pirtis.mode === "session" ? who : hoursLabel(pirtis.hours), schedule: `${date}, ${time}`, price: pirtis.price });
  }
  if (nakvyne) {
    const departure = longDateLabel(nextDays(when.day, nakvyne.nights + 1)[nakvyne.nights]);
    lines.push({ id: "nakvyne", title: "Nakvynė", detail: `${nakvyne.units} × ${roomLabel(nakvyne.roomId, nakvyne.size)}, ${nakvyne.nights} n.`, schedule: `Atvykimas ${dayLabel}, išvykimas ${departure}`, price: nakvyne.price });
  }
  return lines;
}

export const totalOf = (lines: PlanLine[]) => lines.reduce((sum, l) => sum + l.price, 0);
