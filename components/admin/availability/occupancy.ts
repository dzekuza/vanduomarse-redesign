import { parseDay } from "@/lib/admin/format";
import type { Booking } from "@/lib/admin/types";
import { dateKey } from "@/lib/sauna";

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
