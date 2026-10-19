import { AddToCalendar } from "./add-to-calendar";
import type { CalendarEvent } from "@/lib/calendar";

interface ReceiptRow {
  label: string;
  value: string;
}

interface ReceiptProps {
  title: string;
  reference: string;
  rows: ReceiptRow[];
  total: number;
  calendar: CalendarEvent;
  resetLabel: string;
  onReset: () => void;
}

/** Ticket-style confirmation shown after any booking flow. */
export function Receipt({ title, reference, rows, total, calendar, resetLabel, onReset }: ReceiptProps) {
  return (
    <div className="border border-ink bg-foam">
      <div className="flex items-center justify-between border-b border-dashed border-ink px-6 py-4">
        <span className="font-display text-lg font-bold">{title}</span>
        <span className="font-display text-lg font-bold text-rust">{reference}</span>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 px-6 py-6 text-sm sm:grid-cols-4">
        {rows.map((r) => (
          <div key={r.label}>
            <dt className="text-ink/50">{r.label}</dt>
            <dd className="mt-1 font-medium">{r.value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-center justify-between gap-4 border-t border-dashed border-ink px-6 py-4">
        <p className="text-sm text-ink/70">Rezervacija patvirtinta. Patvirtinimą atsiųsime el. paštu.</p>
        <p className="font-display text-2xl font-bold">{total} €</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink px-6 py-4">
        <AddToCalendar event={calendar} reference={reference} />
        <button type="button" onClick={onReset} className="text-sm font-medium text-ink/70 underline underline-offset-4 hover:text-rust">
          {resetLabel}
        </button>
      </div>
    </div>
  );
}
