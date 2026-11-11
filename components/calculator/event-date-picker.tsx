"use client";

import { useMemo } from "react";
import { DateField } from "@/components/reservation/date-field";
import { RESERVATION_DAYS } from "@/lib/reservation";
import { dateKey, nextDays } from "@/lib/sauna";

const DATE_LABEL = new Intl.DateTimeFormat("lt-LT", { year: "numeric", month: "long", day: "numeric" });

/** Event inquiries share the reservation picker without its availability limits. */
export function EventDatePicker({ today, value, onChange }: { today: string; value: string | null; onChange: (date: string) => void }) {
  const days = useMemo(() => nextDays(today, RESERVATION_DAYS), [today]);
  const selected = value ? nextDays(value, 1)[0] : null;

  return (
    <DateField
      label="Renginio data"
      days={days}
      date={selected}
      selectionLabel={selected ? DATE_LABEL.format(selected) : undefined}
      onSelect={(date) => onChange(dateKey(date))}
      onClear={() => onChange("")}
      allowFutureDates
    />
  );
}
