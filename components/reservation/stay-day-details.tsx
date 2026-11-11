import { AvailabilityCount } from "@/components/services/availability-count";
import { CABIN_TOTAL, cabinSize, freeCabinsTotal, freeStayUnits, type CabinAvailability, type StayUnitType } from "@/lib/cabin";
import type { ReservationDayDetails } from "./day-cell";

/** Availability for an arrival date, using the same count as the sauna calendar. */
export function stayDayDetails(availability: CabinAvailability, date: Date, type?: StayUnitType, nights = 1): ReservationDayDetails {
  const free = type === undefined ? freeCabinsTotal(availability, date, nights) : freeStayUnits(availability, date, nights, type);
  const capacity = type === undefined ? CABIN_TOTAL : type === "kemperis" ? undefined : cabinSize(type).count;
  const countLabel = type === "kemperis" ? "Laisvų kemperio vietų" : "Laisvų namelių";
  const label = Number.isFinite(free) ? `${countLabel}: ${free}${capacity ? ` iš ${capacity}` : ""}` : "Kemperio vietų limitas nenurodytas";

  return {
    label,
    available: free > 0,
    indicator: (
      <span className="@container block">
        <span className="block text-calendar-status">
          {Number.isFinite(free) ? <AvailabilityCount free={free} capacity={capacity} binary /> : "Laisva"}
        </span>
      </span>
    ),
  };
}
