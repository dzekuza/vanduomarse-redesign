import type { ReservationDayDetails } from "./day-cell";

export function availableDayDetails(available: boolean): ReservationDayDetails {
  return {
    label: available ? "Yra laisvų laikų" : "Laisvų laikų nėra",
    available,
    indicator: available ? (
      <span className="@container block">
        <span className="flex justify-center text-calendar-status font-bold text-availability-open">Laisva</span>
      </span>
    ) : undefined,
  };
}
