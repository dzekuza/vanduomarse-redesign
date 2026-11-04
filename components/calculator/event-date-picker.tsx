"use client";

import { useMemo } from "react";
import { DatePicker } from "@/components/reservation/date-picker";
import { RESERVATION_DAYS } from "@/lib/reservation";
import { dateKey, nextDays } from "@/lib/sauna";

const DATE_LABEL = new Intl.DateTimeFormat("lt-LT", { year: "numeric", month: "long", day: "numeric" });

/** Event inquiries share the reservation picker without its availability limits. */
export function EventDatePicker({ today, value, onChange }: { today: string; value: string | null; onChange: (date: string) => void }) {
  const days = useMemo(() => nextDays(today, RESERVATION_DAYS), [today]);
  const selected = value ? nextDays(value, 1)[0] : null;

  return (
    <div role="group" aria-label="Renginio data" className="min-w-0">
      <DatePicker days={days} selected={selected} onSelect={(date) => onChange(dateKey(date))} allowFutureDates />
      {selected && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 text-xs text-copy">
          <p>{DATE_LABEL.format(selected)}</p>
          <button type="button" onClick={() => onChange("")} className="min-h-11 hover:underline">
            Išvalyti datą
          </button>
        </div>
      )}
    </div>
  );
}
