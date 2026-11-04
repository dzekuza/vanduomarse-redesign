"use client";

import type { DayIcon } from "@/components/booking/day-picker";
import { DatePicker } from "./date-picker";

interface WhenStepProps {
  days: Date[];
  date: Date;
  onDate: (date: Date) => void;
  /** Availability icons under each day. */
  icons: (date: Date) => DayIcon[];
}

/** Day selection above the form. Start times are chosen per activity. */
export function WhenStep({ days, date, onDate, icons }: WhenStepProps) {
  return (
    <section aria-label="Data" className="min-w-0">
      <DatePicker days={days} selected={date} onSelect={onDate} icons={icons} />
    </section>
  );
}
