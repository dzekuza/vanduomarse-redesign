/**
 * The combined /rezervacija flow: one date and group size, then any mix of
 * sauna, quads and a stay; sauna and quads each take their own start time. Each activity is planned with the same pure
 * rules as its own booking page (`lib/sauna.ts`, `lib/quads.ts`, `lib/cabin.ts`);
 * the database re-prices and re-checks every request on submit.
 */
import {
  CABIN_SIZES,
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
  fromRate,
  hoursLabel,
  isOpenStart,
  maxHoursFrom,
  nextDays,
  pastHourOn,
  sessionPrice,
  startHours,
  type Sauna,
} from "@/lib/sauna";
import type { SaunaEventData } from "@/lib/sauna-events";
import { programRateLine, programTotal, type SaunaProgram } from "@/lib/sauna-programs";
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
  /** A sauna program, or null for plain hourly hire. */
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
export interface ProgramPlan {
  kind: "pirtis";
  mode: "session" | "private";
  program: SaunaProgram;
  /** That day's sessions of a session program. */
  sessions: SaunaEventData[];
  session: SaunaEventData | null;
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

export function togglePick(picks: Picks, id: ActivityId, data: ReservationData): Picks {
  if (!picks[id]) return { ...picks, [id]: defaultPick(id, data) };
  const next = { ...picks };
  delete next[id];
  return next;
}

/** Whole hours `[start, start + hours)` of a private program are free, open and not past. */
export function programStartOpen(sauna: Sauna, hours: number, taken: readonly number[], pastHour: number, start: number): boolean {
  const { rates } = sauna;
  if (start <= pastHour || start < rates.openHour || start + hours > rates.closeHour) return false;
  return Array.from({ length: hours }, (_, i) => start + i).every((h) => !taken.includes(h));
}

/** Start hours a private program can be offered at, before availability. */
export function programStartHours(sauna: Sauna, hours: number): number[] {
  const { openHour, closeHour } = sauna.rates;
  return Array.from({ length: Math.max(0, closeHour - hours - openHour + 1) }, (_, i) => openHour + i);
}

const hourOf = (time: string) => Number(time.slice(0, 2));

/** Whole hours touched by something that starts at `startMin` and lasts `lengthMin` minutes. */
const spanHours = (startMin: number, lengthMin: number) =>
  Array.from({ length: Math.max(0, Math.ceil((startMin + lengthMin) / 60) - Math.floor(startMin / 60)) }, (_, i) => Math.floor(startMin / 60) + i);

/** Hours of the day a plan occupies (for keeping the sauna and the quads from overlapping); a stay or an unset time occupies none. */
export function planHours(plan: PirtisPlan | QuadPlan | StayPlan | null | undefined): number[] {
  if (!plan || plan.kind === "nakvyne" || plan.startHour === null) return [];
  const startMin = plan.kind === "pirtis" && plan.mode === "session" && plan.session ? hourOf(plan.session.time) * 60 + Number(plan.session.time.slice(3, 5)) : plan.startHour * 60;
  return spanHours(startMin, plan.hours * 60);
}

function planSession(pick: SaunaPick, program: SaunaProgram, data: SaunaPageData, when: When, busy: readonly number[]): ProgramPlan {
  const sessions = data.events.filter((e) => e.programId === program.id && e.date === when.day);
  const session = sessions.find((e) => e.key === pick.eventId) ?? null;
  const family = program.pricing === "family";
  const children = family ? Math.max(0, Math.min(pick.children, when.people - 1)) : 0;
  const adults = when.people - children;
  const sessionHours = session ? spanHours(hourOf(session.time) * 60 + Number(session.time.slice(3, 5)), program.durationMinutes) : [];
  const ok = session !== null && session.spotsLeft >= when.people && !sessionHours.some((h) => busy.includes(h));
  return {
    kind: "pirtis", mode: "session", program, sessions, session, sauna: null,
    startHour: session ? hourOf(session.time) : null, hours: program.durationMinutes / 60, adults, children, ok,
    price: ok ? programTotal(program, adults, children) : 0,
  };
}

function planPrivate(pick: SaunaPick, program: SaunaProgram, data: SaunaPageData, when: When, busy: readonly number[]): ProgramPlan {
  const sauna = data.saunas.find((s) => s.id === program.saunaId) ?? null;
  const hours = program.durationMinutes / 60;
  const taken = [...(sauna ? (data.takenBySauna[sauna.id]?.[when.day] ?? []) : []), ...busy];
  const start = pick.startHour;
  const fits = sauna !== null && when.people <= Math.min(program.capacity ?? 0, sauna.rates.maxParty);
  const ok = fits && start !== null && programStartOpen(sauna, hours, taken, pastHourOn(when.day, data.today, data.nowHour), start);
  return {
    kind: "pirtis", mode: "private", program, sessions: [], session: null, sauna, startHour: start, hours,
    adults: when.people, children: 0, ok, price: ok ? program.price : 0,
  };
}

/** One bookable seansas of the day in the Pirtis list: a scheduled session, a private program start or an hourly-hire start. */
export interface SessionRow {
  key: string;
  mode: "session" | "private" | "hourly";
  /** Minutes since midnight, for ordering. */
  startMin: number;
  /** "15:00–18:00", or "nuo 10:00" for hourly hire (the length is chosen next). */
  time: string;
  title: string;
  label: string;
  description: string;
  rate: string;
  /** Free seats, or what the booking covers. */
  seats: string;
  maxPeople: number;
  /** Overlaps something else in the plan (the quads); shown but not selectable. */
  blocked: boolean;
  programId: string | null;
  eventId: string | null;
  saunaId: string | null;
}

const clock = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const MODE_ORDER = { session: 0, private: 1, hourly: 2 } as const;

/** Every seansas with an open slot on the chosen day, earliest first. */
export function sessionRows(data: SaunaPageData, day: string, busy: readonly number[] = []): SessionRow[] {
  const rows: SessionRow[] = [];
  const past = pastHourOn(day, data.today, data.nowHour);
  for (const p of data.programs) {
    if (p.kind === "session") {
      for (const e of data.events) {
        const start = hourOf(e.time) * 60 + Number(e.time.slice(3, 5));
        if (e.programId !== p.id || e.date !== day || e.spotsLeft < 1 || start / 60 < past + 1) continue;
        rows.push({
          key: `s-${e.key}`, mode: "session", startMin: start, time: `${e.time}–${clock(start + p.durationMinutes)}`, title: p.name, label: p.label,
          description: p.description, rate: programRateLine(p),
          seats: `Liko vietų: ${e.spotsLeft}${e.capacity ? `/${e.capacity}` : ""}`, maxPeople: e.spotsLeft,
          programId: p.id, eventId: e.key, saunaId: null,
          blocked: spanHours(start, p.durationMinutes).some((h) => busy.includes(h)),
        });
      }
      continue;
    }
    const sauna = data.saunas.find((s) => s.id === p.saunaId);
    if (!sauna) continue;
    const maxPeople = Math.min(p.capacity ?? 0, sauna.rates.maxParty);
    if (maxPeople < 1) continue;
    const hours = p.durationMinutes / 60;
    const taken = data.takenBySauna[sauna.id]?.[day] ?? [];
    for (const h of programStartHours(sauna, hours)) {
      if (!programStartOpen(sauna, hours, taken, past, h)) continue;
      rows.push({
        key: `p-${p.id}-${h}`, mode: "private", startMin: h * 60, time: `${formatHour(h)}–${formatHour(h + hours)}`, title: p.name, label: p.label,
        description: p.description, rate: programRateLine(p), seats: `Visa pirtis, iki ${maxPeople} žm.`, maxPeople,
        programId: p.id, eventId: null, saunaId: null,
        blocked: !programStartOpen(sauna, hours, [...taken, ...busy], past, h),
      });
    }
  }
  for (const s of data.saunas) {
    if (s.rates.maxParty < 1) continue;
    const taken = data.takenBySauna[s.id]?.[day] ?? [];
    for (const h of startHours(s.rates)) {
      if (!isOpenStart(taken, h, s.rates, past)) continue;
      rows.push({
        key: `h-${s.id}-${h}`, mode: "hourly", startMin: h * 60, time: `nuo ${formatHour(h)}`, title: data.saunas.length > 1 ? `Pirtis valandoms · ${s.name}` : "Pirtis valandoms",
        label: "Laisvas laikas", description: "Pasirink trukmę ir priedus patys. Kaina visai grupei.", rate: `nuo ${fromRate(s.rates)} € / val.`,
        seats: "Visa pirtis grupei", maxPeople: s.rates.maxParty, programId: null, eventId: null, saunaId: s.id,
        blocked: !isOpenStart([...taken, ...busy], h, s.rates, past),
      });
    }
  }
  for (const r of rows) if (r.blocked) r.seats = "Kertasi su jūsų planu";
  return rows.sort((a, b) => a.startMin - b.startMin || MODE_ORDER[a.mode] - MODE_ORDER[b.mode]);
}

/** Is this row the one the plan currently holds? */
export function rowSelected(row: SessionRow, plan: PirtisPlan): boolean {
  const start = Math.floor(row.startMin / 60);
  if (plan.mode === "hourly") return row.mode === "hourly" && plan.sauna.id === row.saunaId && plan.startHour === start;
  if (plan.mode === "session") return row.mode === "session" && plan.session?.key === row.eventId;
  return row.mode === "private" && plan.program.id === row.programId && plan.startHour === start;
}

/** The pick for choosing a row, starting from what the plan holds. */
export function pickForRow(row: SessionRow, plan: PirtisPlan, data: SaunaPageData): SaunaPick {
  const base = pickFromPlan(plan, data);
  const start = Math.floor(row.startMin / 60);
  if (row.mode === "session") return { ...base, programId: row.programId, eventId: row.eventId, children: 0, startHour: null };
  if (row.mode === "private") return { ...base, programId: row.programId, eventId: null, children: 0, startHour: start };
  const sauna = data.saunas.find((s) => s.id === row.saunaId);
  return { ...base, programId: null, eventId: null, children: 0, saunaId: row.saunaId ?? base.saunaId, startHour: start, hours: sauna?.rates.minHours ?? base.hours, extras: {} };
}

/** The pick that produced a plan, so a card can change one field of it. */
export function pickFromPlan(plan: PirtisPlan, data: SaunaPageData): SaunaPick {
  const first = data.saunas[0];
  if (plan.mode === "hourly") {
    return { programId: null, eventId: null, children: 0, saunaId: plan.sauna.id, startHour: plan.startHour, hours: plan.hours, extras: plan.extras };
  }
  return {
    programId: plan.program.id,
    eventId: plan.session?.key ?? null,
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
  if (program?.kind === "session") return planSession(pick, program, data, when, busy);
  if (program?.kind === "private") return planPrivate(pick, program, data, when, busy);
  return planHourly(pick, data, when, busy);
}

function planHourly(pick: SaunaPick, data: SaunaPageData, when: When, busy: readonly number[]): SaunaPlan | null {
  const sauna = data.saunas.find((s) => s.id === pick.saunaId) ?? data.saunas[0];
  if (!sauna) return null;
  const { rates } = sauna;
  const taken = [...(data.takenBySauna[sauna.id]?.[when.day] ?? []), ...busy];
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
  const ok = Number.isInteger(units) && units >= 1 && units <= Math.min(MAX_STAY_UNITS, free(roomId === "namelis" ? size : roomId));
  return { ...pick, kind: "nakvyne", free, ok, price: ok ? roomPrice(roomId, size) * nights * units : 0 };
}

/**
 * Whether the sauna can host `people`, a quad is free, or a stay is available for one night on `day`.
 */
export function dayAvailability(data: ReservationData, day: string, people: number): Record<ActivityId, boolean> {
  const past = pastHourOn(day, data.sauna.today, data.sauna.nowHour);
  const programOpen = data.sauna.programs.some((p) => {
    if (p.kind === "session") return data.sauna.events.some((e) => e.programId === p.id && e.date === day && e.spotsLeft >= people);
    const sauna = data.sauna.saunas.find((s) => s.id === p.saunaId);
    if (!sauna || people > Math.min(p.capacity ?? 0, sauna.rates.maxParty)) return false;
    const taken = data.sauna.takenBySauna[sauna.id]?.[day] ?? [];
    return programStartHours(sauna, p.durationMinutes / 60).some((h) => programStartOpen(sauna, p.durationMinutes / 60, taken, past, h));
  });
  const hourlyOpen = data.sauna.saunas.some((s) => {
    const taken = data.sauna.takenBySauna[s.id]?.[day] ?? [];
    return people <= s.rates.maxParty && startHours(s.rates).some((h) => isOpenStart(taken, h, s.rates, past));
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
  const hasStay = (type: StayUnitType) => freeStayUnits(data.cabin.availability, checkIn, 1, type) > 0;
  const nakvyne = hasStay("kemperis") || CABIN_SIZES.some(({ id }) => hasStay(id));
  return { pirtis: hourlyOpen || programOpen, keturraciai, nakvyne };
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

export function describePlans(plans: Plans): PlanLine[] {
  const lines: PlanLine[] = [];
  const { pirtis, keturraciai, nakvyne } = plans;
  if (keturraciai) {
    const time = keturraciai.startHour === null ? "Pasirink laiką" : `${hourLabel(keturraciai.startHour)}-${hourLabel(keturraciai.startHour + keturraciai.hours)}`;
    const quantities = keturraciai.items.map(({ type, units }) => `${units} × ${type.name}`);
    lines.push({ id: "keturraciai", title: "Keturračiai", detail: [...quantities, time].join(", "), price: keturraciai.price });
  }
  if (pirtis?.mode === "hourly") {
    const extras = upsellSummary(pirtis.upsells, pirtis.extras);
    const time = pirtis.startHour === null ? "Pasirink laiką" : `${formatHour(pirtis.startHour)}-${formatHour(pirtis.startHour + pirtis.hours)}, ${hoursLabel(pirtis.hours)}`;
    lines.push({ id: "pirtis", title: pirtis.sauna.name.startsWith("Pirtis") ? pirtis.sauna.name : `Pirtis · ${pirtis.sauna.name}`, detail: [time, ...extras].join(", "), price: pirtis.price });
  } else if (pirtis) {
    const who = `${pirtis.adults} ${pirtis.children ? "suaug." : "žm."}${pirtis.children ? ` + ${pirtis.children} vaik.` : ""}`;
    const time = pirtis.startHour === null ? "Pasirink laiką" : `${formatHour(pirtis.startHour)}-${formatHour(pirtis.startHour + Math.ceil(pirtis.hours))}`;
    lines.push({ id: "pirtis", title: pirtis.program.name, detail: pirtis.mode === "session" ? `${time}, ${who}` : `${time}, ${hoursLabel(pirtis.hours)}`, price: pirtis.price });
  }
  if (nakvyne) {
    lines.push({ id: "nakvyne", title: "Nakvynė", detail: `${nakvyne.units} × ${roomLabel(nakvyne.roomId, nakvyne.size)}, ${nakvyne.nights} n.`, price: nakvyne.price });
  }
  return lines;
}

/** One line selling an activity that is still free on the chosen day, for the "we also have..." popup. */
export function extraOfferText(id: ActivityId, data: ReservationData, inPlan: ActivityId[]): string {
  if (id === "keturraciai") {
    const from = Math.min(...data.quads.types.filter((t) => t.units > 0).map((t) => t.pricePerHour));
    return `Keturračiai nuo ${from} € / val. ${inPlan.includes("pirtis") ? "Pavažinėk prieš pirtį ar po jos." : "Pavažinėk ežero apylinkėmis."}`;
  }
  if (id === "nakvyne") return `Nameliai nuo ${CABIN_SIZES[0].pricePerNight} € / naktį. Pasilik per naktį ir pailsėk.`;
  const from = Math.min(...data.sauna.saunas.map((s) => fromRate(s.rates)));
  return `Pirtis nuo ${from} € / val. ${inPlan.includes("keturraciai") ? "Pasikaitink prieš keturračius ar po jų." : "Po dienos nuotykių pasikaitink."}`;
}

export const totalOf = (lines: PlanLine[]) => lines.reduce((sum, l) => sum + l.price, 0);
