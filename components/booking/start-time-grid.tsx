"use client";

import { ChoiceTile } from "./choice-tile";
import { MIN_HOURS, START_HOURS, formatHour, hourRate, maxHoursFrom } from "@/lib/sauna";

interface StartTimeGridProps {
  date: Date;
  dateK: string;
  selected: number | null;
  onSelect: (hour: number) => void;
}

/** Hourly start times; a start is open only if the minimum session fits after it. */
export function StartTimeGrid({ date, dateK, selected, onSelect }: StartTimeGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {START_HOURS.map((hour) => (
        <ChoiceTile
          key={hour}
          primary={formatHour(hour)}
          secondary={`${hourRate(date, hour)} €/val.`}
          active={selected === hour}
          disabled={maxHoursFrom(dateK, hour) < MIN_HOURS}
          onClick={() => onSelect(hour)}
        />
      ))}
    </div>
  );
}
