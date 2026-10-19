"use client";

import { ChoiceTile } from "./choice-tile";
import { MAX_HOURS, MIN_HOURS, formatHour, hoursLabel, sessionPrice } from "@/lib/sauna";

interface DurationPickerProps {
  partySize: number;
  startHour: number;
  /** Longest run available from the start, capped by closing and the next booking. */
  maxHours: number;
  selected: number;
  onSelect: (hours: number) => void;
}

const OPTIONS = Array.from({ length: MAX_HOURS - MIN_HOURS + 1 }, (_, i) => MIN_HOURS + i);

/** Session length from the chosen start, with end time and price on each option. */
export function DurationPicker({ partySize, startHour, maxHours, selected, onSelect }: DurationPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {OPTIONS.map((hours) => (
        <ChoiceTile
          key={hours}
          primary={hoursLabel(hours)}
          secondary={`iki ${formatHour(startHour + hours)} · ${sessionPrice(hours, partySize)} €`}
          active={selected === hours}
          disabled={hours > maxHours}
          onClick={() => onSelect(hours)}
        />
      ))}
    </div>
  );
}
