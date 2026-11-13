import { quadTourStarts } from "@/components/quads/quad-tour-plan";
import type { QuadRental } from "@/lib/admin/types";
import { freeAt, longestFrom, type QuadSettings, type QuadTaken, type QuadTourRoute, type QuadType } from "@/lib/quads";
import { todayKey, vilniusHour as parkHour } from "@/lib/sauna";

/** Quads taken per day, type and hour from the rentals the admin holds (cancelled ones free their quads), like `quad_taken()` on the public page. */
export function quadTakenFromRentals(rentals: readonly QuadRental[]): QuadTaken {
  const taken: QuadTaken = {};
  for (const rental of rentals) {
    if (rental.status === "atsaukta") continue;
    for (const { quadTypeId, units } of rental.items) {
      const byHour = ((taken[rental.date] ??= {})[quadTypeId] ??= {});
      for (let hour = rental.startHour; hour < rental.startHour + rental.hours; hour++) byHour[hour] = (byHour[hour] ?? 0) + units;
    }
  }
  return taken;
}

export interface QuadFleet {
  types: readonly QuadType[];
  settings: QuadSettings;
  rentals: readonly QuadRental[];
}

/**
 * Start hours of a tour on `day`: any hour the free fleet covers the whole route with at least the route's minimum number
 * of quads (the public page's rule), with how many quads are free for it. Hours already past today are left out.
 */
export function tourStartsOn(day: string, route: QuadTourRoute, fleet: QuadFleet, now = new Date()) {
  const data = { settings: fleet.settings, types: [...fleet.types], taken: quadTakenFromRentals(fleet.rentals), today: todayKey(now), nowHour: parkHour(now) };
  return quadTourStarts(data, day, route);
}

/** Start hours for an hourly rental of `units` quads of one type for `hours`: only hours the type stays free for the whole time. */
export function rentalStartsOn(day: string, type: QuadType, units: number, hours: number, fleet: QuadFleet, now = new Date()): number[] {
  const taken = quadTakenFromRentals(fleet.rentals);
  const past = day === todayKey(now) ? parkHour(now) : -1;
  const { settings } = fleet;
  const starts: number[] = [];
  for (let hour = Math.max(settings.openHour, past + 1); hour < settings.closeHour; hour++) {
    if (hours >= 1 && hour + hours <= settings.closeHour && hours <= settings.maxHours && longestFrom(type, taken, day, hour, units, settings) >= hours) starts.push(hour);
  }
  return starts;
}

/** Quads of `type` free for the whole of a rental starting at `hour` for `hours`. */
export function freeForRental(day: string, type: QuadType, hour: number, hours: number, fleet: QuadFleet): number {
  const taken = quadTakenFromRentals(fleet.rentals);
  return Math.min(...Array.from({ length: Math.max(1, hours) }, (_, offset) => freeAt(type, taken, day, hour + offset)));
}
