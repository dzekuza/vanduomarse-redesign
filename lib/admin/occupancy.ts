import { parseDay } from "@/lib/admin/format";
import type { Block, Booking, ManagedEvent } from "./types";
import type { SaunaProgram } from "@/lib/sauna-programs";
import type { StayType } from "@/lib/cabin";
import { dateKey, type SaunaRates } from "@/lib/sauna";

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

/** Cabin or camper units occupied during the night of `day`, of one stay type when `typeId` is given. */
export function stayUnitsOn(bookings: Booking[], day: string, kind: "namelis" | "kemperis", typeId?: string): number {
  return bookings.reduce((total, b) => {
    if (!active(b) || b.kind !== kind || !b.nights || (typeId !== undefined && b.stayTypeId !== typeId)) return total;
    const end = parseDay(b.date);
    end.setDate(end.getDate() + b.nights);
    return b.date <= day && day < dateKey(end) ? total + (b.stayUnits ?? 1) : total;
  }, 0);
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

/** Start hours on `day` where at least the minimum session fits. */
export function freeStartHours(bookings: Booking[], blocks: Block[], rates: SaunaRates, day: string): number[] {
  const hours: number[] = [];
  for (let h = rates.openHour; h + rates.minHours <= rates.closeHour; h++) {
    if (freeHoursFrom(bookings, blocks, rates, day, h) >= rates.minHours) hours.push(h);
  }
  return hours;
}

/** Nights (from `day`, for `nights`) on which every unit of this stay type is already taken; none for unlimited stock. */
export function fullStayNights(bookings: Booking[], day: string, nights: number, type: StayType): string[] {
  const { units } = type;
  if (units === null) return [];
  return daysFrom(parseDay(day), nights).filter((d) => stayUnitsOn(bookings, d, type.kind, type.id) >= units);
}
