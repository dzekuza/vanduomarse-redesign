"use client";

import { ChoiceTile } from "./choice-tile";
import { formatHour, hoursLabel, maxHoursFrom, startHours, type SaunaRates } from "@/lib/sauna";

interface StartTimeGridProps {
  /** Booked or closed hours on the chosen day. */
  taken: readonly number[];
  rates: SaunaRates;
  selected: number | null;
  onSelect: (hour: number) => void;
}

/** Hourly start times; a start is open only if the minimum session fits after it. */
export function StartTimeGrid({ taken, rates, selected, onSelect }: StartTimeGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {startHours(rates).map((hour) => {
        const longest = maxHoursFrom(taken, hour, rates);
        return (
          <ChoiceTile
            key={hour}
            primary={formatHour(hour)}
            secondary={longest < rates.minHours ? "Užimta" : `iki ${hoursLabel(longest)}`}
            active={selected === hour}
            disabled={longest < rates.minHours}
            onClick={() => onSelect(hour)}
          />
        );
      })}
    </div>
  );
}
