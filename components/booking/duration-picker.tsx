"use client";

import { ChoiceTile } from "./choice-tile";
import { formatHour, hoursLabel, sessionLengths, sessionPrice, type SaunaRates } from "@/lib/sauna";

interface DurationPickerProps {
  rates: SaunaRates;
  partySize: number;
  startHour: number;
  /** Longest run available from the start, capped by closing and the next booking. */
  maxHours: number;
  selected: number;
  onSelect: (hours: number) => void;
}

/** Session length from the chosen start, with end time and price on each option. */
export function DurationPicker({ rates, partySize, startHour, maxHours, selected, onSelect }: DurationPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {sessionLengths(rates).map((hours) => (
        <ChoiceTile
          key={hours}
          primary={hoursLabel(hours)}
          secondary={`iki ${formatHour(startHour + hours)} · ${sessionPrice(hours, partySize, rates)} €`}
          active={selected === hours}
          disabled={hours > maxHours}
          onClick={() => onSelect(hours)}
        />
      ))}
    </div>
  );
}
