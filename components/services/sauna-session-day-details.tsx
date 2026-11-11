import type { ReservationDayDetails } from "@/components/reservation/day-cell";
import type { SessionRow } from "@/lib/reservation";
import { AvailabilityCount } from "./availability-count";

export const SESSION_PREVIEW_LIMIT = 2;

export function SaunaSessionDayIndicator({ rows }: { rows: SessionRow[] }) {
  const remaining = rows.length - SESSION_PREVIEW_LIMIT;
  return (
    <span className="@container block">
      <span className="block divide-y divide-line text-calendar-status">
        {rows.slice(0, SESSION_PREVIEW_LIMIT).map(({ key, time, maxPeople, capacity }) => (
          <span key={key} className="flex flex-wrap items-center justify-center gap-x-1 py-0.5">
            <span className="font-medium whitespace-nowrap tabular-nums">{time.split("–")[0]}</span>
            <AvailabilityCount free={maxPeople} capacity={capacity} binary />
          </span>
        ))}
        {remaining > 0 ? <span className="block pt-0.5 text-center tabular-nums">+{remaining}</span> : null}
      </span>
    </span>
  );
}

export function saunaSessionDayDetails(rows: SessionRow[]): ReservationDayDetails {
  if (!rows.length) return { label: "Seansų nėra", available: false };

  return {
    label: rows.map(({ time, title, seats }) => `${time} · ${title} · ${seats}`).join(". "),
    available: rows.some(({ maxPeople }) => maxPeople > 0),
    indicator: <SaunaSessionDayIndicator rows={rows} />,
  };
}
