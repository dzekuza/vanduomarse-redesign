"use client";

import { ChoiceTile } from "./choice-tile";
import { formatHour, hoursLabel, isOpenStart, maxHoursFrom, startHours, type SaunaRates } from "@/lib/sauna";

interface StartTimeGridProps {
  /** Booked or closed hours on the chosen day. */
  taken: readonly number[];
  rates: SaunaRates;
  /** Starts at or before this hour are already gone (today); -1 on later days. */
  pastHour: number;
  selected: number | null;
  onSelect: (hour: number) => void;
}

/** Hourly start times; a start is open only if it has not passed and the minimum session fits after it. */
export function StartTimeGrid({ taken, rates, pastHour, selected, onSelect }: StartTimeGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {startHours(rates).map((hour) => {
        const past = hour <= pastHour;
        const open = isOpenStart(taken, hour, rates, pastHour);
        return (
          <ChoiceTile
            key={hour}
            primary={formatHour(hour)}
            secondary={past ? "Praėjo" : open ? `iki ${hoursLabel(maxHoursFrom(taken, hour, rates))}` : "Užimta"}
            active={selected === hour}
            disabled={!open}
            onClick={() => onSelect(hour)}
          />
        );
      })}
    </div>
  );
}
