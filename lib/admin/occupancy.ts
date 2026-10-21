import { parseDay } from "@/lib/admin/format";
import { CABIN_COUNT } from "./labels";
import type { Block, Booking } from "./types";
import { dateKey, type SaunaRates } from "@/lib/sauna";

const active = (b: Booking) => b.status !== "atsaukta";

/** The sauna booking covering `hour` on `day`, if any. */
export function saunaBookingAt(bookings: Booking[], day: string, hour: number): Booking | undefined {
  return bookings.find(
    (b) => active(b) && b.kind === "pirtis" && b.date === day && b.startHour !== undefined && hour >= b.startHour && hour < b.startHour + (b.hours ?? 0),
  );
}

/** Stays (cabin or camper) occupying the night of `day`. */
export function staysOn(bookings: Booking[], day: string, kind: "namelis" | "kemperis"): Booking[] {
  return bookings.filter((b) => {
    if (!active(b) || b.kind !== kind || !b.nights) return false;
    const end = parseDay(b.date);
    end.setDate(end.getDate() + b.nights);
    return b.date <= day && day < dateKey(end);
  });
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

/** Nights (from `day`, for `nights`) on which every cabin is already taken. */
export function fullCabinNights(bookings: Booking[], day: string, nights: number): string[] {
  const start = parseDay(day);
  return daysFrom(start, nights).filter((d) => staysOn(bookings, d, "namelis").length >= CABIN_COUNT);
}
