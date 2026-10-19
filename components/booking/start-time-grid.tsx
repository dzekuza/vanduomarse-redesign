"use client";

import { ChoiceTile } from "./choice-tile";
import { MIN_HOURS, START_HOURS, formatHour, hoursLabel, maxHoursFrom } from "@/lib/sauna";

interface StartTimeGridProps {
  dateK: string;
  selected: number | null;
  onSelect: (hour: number) => void;
}

/** Hourly start times; a start is open only if the minimum session fits after it. */
export function StartTimeGrid({ dateK, selected, onSelect }: StartTimeGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {START_HOURS.map((hour) => {
        const longest = maxHoursFrom(dateK, hour);
        return (
          <ChoiceTile
            key={hour}
            primary={formatHour(hour)}
            secondary={longest < MIN_HOURS ? "Užimta" : `iki ${hoursLabel(longest)}`}
            active={selected === hour}
            disabled={longest < MIN_HOURS}
            onClick={() => onSelect(hour)}
          />
        );
      })}
    </div>
  );
}
