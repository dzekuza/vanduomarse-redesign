import { parseDay } from "@/lib/admin/format";
import type { Block, Booking, ExternalBlock, ManagedEvent } from "./types";
import type { SaunaProgram } from "@/lib/sauna-programs";
import type { StayType } from "@/lib/cabin";
import { FULL_DAY_HOURS, dateKey, sessionLengths, type SaunaRates } from "@/lib/sauna";

const active = (b: Booking) => b.status !== "atsaukta";

/** One sauna's bookings and closed hours, for the helpers below. */
export function saunaSlice(bookings: Booking[], blocks: Block[], saunaId: string) {
  return { bookings: bookings.filter((b) => b.saunaId === saunaId), blocks: blocks.filter((b) => b.saunaId === saunaId) };
}

/** The sauna booking covering `hour` on `day`, if any. */
export function saunaBookingAt(bookings: Booking[], day: string, hour: number): Booking | undefined {
  return bookings.find(
    (b) => active(b) && b.kind === "pirtis" && b.date === day && b.startHour !== undefined && hour >= b.startHour && hour < b.startHour + (b.hours ?? 0),
  );
}

/** The sauna the public sessions are held in; they occupy it even when every ticket is sold. */
export const SESSION_SAUNA_ID = "pirtis-marse";

/** The published public sauna session covering `hour` on `day` (same-day part of the session), if any. */
export function saunaSessionAt(events: readonly ManagedEvent[], programs: readonly SaunaProgram[], day: string, hour: number): ManagedEvent | undefined {
  return events.find((e) => {
    if (!e.published || e.category !== "pirtis" || e.date !== day) return false;
    const start = Number(e.time.slice(0, 2)) * 60 + Number(e.time.slice(3, 5));
    const minutes = e.durationMinutes ?? programs.find((p) => p.id === e.programId)?.durationMinutes ?? 60;
    return hour * 60 < start + minutes && (hour + 1) * 60 > start;
  });
}

/** Last night of a Sirvoy block, exclusive end: the check-out day. */
function blockEnd(b: ExternalBlock): string {
  const end = parseDay(b.startsOn);
  end.setDate(end.getDate() + b.nights);
  return dateKey(end);
}

/** Rooms the Sirvoy feeds hold on the night of `day` (one per room however many events overlap), of one stay type when `typeId` is given. */
export function externalUnitsOn(blocks: readonly ExternalBlock[], day: string, typeId?: string): number {
  const rooms = new Set<string>();
  for (const b of blocks) {
    if ((typeId === undefined || b.stayTypeId === typeId) && b.startsOn <= day && day < blockEnd(b)) rooms.add(b.calendarId);
  }
  return rooms.size;
}

/**
 * Cabin or camper units occupied during the night of `day`, of one stay type when `typeId` is given.
 * Pass the Sirvoy blocks to count the rooms Booking.com and the front desk have taken (cabins only).
 */
export function stayUnitsOn(bookings: Booking[], day: string, kind: "namelis" | "kemperis", typeId?: string, external: readonly ExternalBlock[] = []): number {
  const own = bookings.reduce((total, b) => {
    if (!active(b) || b.kind !== kind || !b.nights || (typeId !== undefined && b.stayTypeId !== typeId)) return total;
    const end = parseDay(b.date);
    end.setDate(end.getDate() + b.nights);
    return b.date <= day && day < dateKey(end) ? total + (b.stayUnits ?? 1) : total;
  }, 0);
  return kind === "namelis" ? own + externalUnitsOn(external, day, typeId) : own;
}

export function daysFrom(start: Date, count: number): string[] {
  return Array.from({ length: count }, (_, i) => dateKey(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)));
}

/** True if a sauna hour is booked or closed by staff. */
export function saunaHourTaken(bookings: Booking[], blocks: Block[], day: string, hour: number): boolean {
  return !!saunaBookingAt(bookings, day, hour) || blocks.some((b) => b.date === day && b.hour === hour);
}

/** Longest free run from `start` on `day`, capped by closing and the max session length. */
export function freeHoursFrom(bookings: Booking[], blocks: Block[], rates: SaunaRates, day: string, start: number): number {
  let n = 0;
  while (n < rates.maxHours && start + n < rates.closeHour && !saunaHourTaken(bookings, blocks, day, start + n)) n++;
  return n;
}

/** Longest free run from `start` to closing, without the max session length: what a whole-day hire needs. */
export function freeHoursToClose(bookings: Booking[], blocks: Block[], rates: SaunaRates, day: string, start: number): number {
  let n = 0;
  while (start + n < rates.closeHour && !saunaHourTaken(bookings, blocks, day, start + n)) n++;
  return n;
}

/**
 * Lengths staff can pick from `start`: the price table's hourly lengths that fit, plus "Visa diena" (FULL_DAY_HOURS)
 * when everything from the start to closing is free and that is longer than any hourly length. It is offered even
 * when the sauna has no full-day price: staff set the price themselves.
 */
export function pickableLengths(bookings: Booking[], blocks: Block[], rates: SaunaRates, day: string, start: number): number[] {
  const hourly = sessionLengths(rates, day).filter((h) => h < FULL_DAY_HOURS);
  const run = freeHoursFrom(bookings, blocks, rates, day, start);
  const toClose = rates.closeHour - start;
  const wholeDay = toClose > Math.max(0, ...hourly) && freeHoursToClose(bookings, blocks, rates, day, start) >= toClose;
  const fits = hourly.filter((h) => h <= run);
  return wholeDay ? [...fits, FULL_DAY_HOURS] : fits;
}

/** Hours a picked length books: "Visa diena" runs from the start to closing, every other length is what it says. */
export const bookedHours = (rates: SaunaRates, start: number, length: number): number =>
  length === FULL_DAY_HOURS ? rates.closeHour - start : length;

/** Start hours on `day` where at least the minimum session fits. */
export function freeStartHours(bookings: Booking[], blocks: Block[], rates: SaunaRates, day: string): number[] {
  const hours: number[] = [];
  for (let h = rates.openHour; h + rates.minHours <= rates.closeHour; h++) {
    if (freeHoursFrom(bookings, blocks, rates, day, h) >= rates.minHours) hours.push(h);
  }
  return hours;
}

/** Nights (from `day`, for `nights`) on which every unit of this stay type is already taken; none for unlimited stock. */
export function fullStayNights(bookings: Booking[], day: string, nights: number, type: StayType, external: readonly ExternalBlock[] = []): string[] {
  const { units } = type;
  if (units === null) return [];
  return daysFrom(parseDay(day), nights).filter((d) => stayUnitsOn(bookings, d, type.kind, type.id, external) >= units);
}
