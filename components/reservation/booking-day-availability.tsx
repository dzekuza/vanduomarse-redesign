import type { ReservationDayDetails } from "./day-cell";

export function bookingDayAvailability(available: boolean, onInk: boolean, accessibleLabel?: string): ReservationDayDetails {
  const label = available ? "Laisva" : "Pilna";
  const color = onInk
    ? available ? "text-availability-open-on-ink" : "text-rust"
    : available ? "text-availability-open" : "text-rust-ink";
  return {
    label: accessibleLabel ?? label,
    available,
    indicator: (
      <span className="@container mx-auto block w-6">
        <span className={`relative left-1/2 block w-max -translate-x-1/2 text-calendar-status font-bold ${color}`}>{label}</span>
      </span>
    ),
  };
}
