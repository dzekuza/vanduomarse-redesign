import { AvailabilityCount } from "@/components/services/availability-count";
import { freeStayUnitsOfKind, stayStock, type CabinAvailability, type StayType } from "@/lib/cabin";
import type { ReservationDayDetails } from "./day-cell";

/**
 * Free cabins of the arrival date out of the park's stock, counted like the sauna calendar.
 * Null when there are no limited cabins to count (only camper pitches), so the caller keeps its plain label.
 */
export function stayDayDetails(types: readonly StayType[], availability: CabinAvailability, date: Date, nights = 1): ReservationDayDetails | null {
  const capacity = stayStock(types, "namelis");
  if (capacity === 0) return null;
  const free = freeStayUnitsOfKind(types, availability, date, nights, "namelis");
  return stayAvailabilityDetails("Laisvų namelių", free, capacity);
}

export function stayAvailabilityDetails(label: string, free: number, capacity?: number): ReservationDayDetails {
  return {
    label: capacity === undefined ? (free > 0 ? `${label}: yra vietų` : `${label}: užimta`) : `${label}: ${free} iš ${capacity}`,
    available: free > 0,
    indicator: capacity === undefined ? undefined : (
      <span className="@container block">
        <span className="block text-calendar-status">
          <AvailabilityCount free={free} capacity={capacity} binary />
        </span>
      </span>
    ),
  };
}
