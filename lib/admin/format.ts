import { CABIN_SIZES, cabinStayType, roomLabel } from "@/lib/cabin";
import type { QuadType } from "@/lib/quads";
import { formatHour, longDateLabel, weekdayLabel } from "@/lib/sauna";
import { BOOKING_KIND } from "./labels";
import type { Booking, QuadRental } from "./types";


/** yyyy-mm-dd -> local Date at midnight (no UTC shift). */
export function parseDay(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "Pr, 19 Spalio": same wording as the public booking pages. */
export function formatDay(key: string): string {
  const d = parseDay(key);
  return `${weekdayLabel(d)}, ${longDateLabel(d)}`;
}

/** "19 Spalio, 14:05" */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${longDateLabel(d)}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
export const formatEur = (n: number) => `${Math.round(n).toLocaleString("lt-LT")} €`;
export const formatEurRange = (r: { min: number; max: number }) =>
  r.min === r.max ? formatEur(r.min) : `${Math.round(r.min).toLocaleString("lt-LT")}–${formatEur(r.max)}`;

/** Booking type, including the size and quantity of a stay when known. */
export function bookingTypeLabel(b: Booking): string {
  const size = b.kind === "namelis" ? CABIN_SIZES.find((s) => cabinStayType(s.id) === b.stayTypeId) : undefined;
  const label = size ? roomLabel("namelis", size.id) : BOOKING_KIND[b.kind];
  const units = b.stayUnits ?? 1;
  return units > 1 ? `${units} × ${label}` : label;
}

/** "15:00–18:00" for sauna, "3 naktys" for stays. */
export function bookingWhen(b: Booking): string {
  if (b.kind === "pirtis" && b.startHour !== undefined && b.hours) return `${formatHour(b.startHour)}–${formatHour(b.startHour + b.hours)}`;
  return b.nights ? `${b.nights} ${b.nights === 1 ? "naktis" : "naktys"}` : "";
}

/** Quantities and fleet names for a rental, including a mix of types. */
export function quadRentalLabel(rental: QuadRental, quadTypes: readonly QuadType[]): string {
  return rental.items
    .map(({ quadTypeId, units }) => `${units} × ${quadTypes.find((type) => type.id === quadTypeId)?.name ?? quadTypeId}`)
    .join(" + ") || `Keturračiai (${rental.units} vnt.)`;
}
