"use client";

import { ChoiceTile } from "./choice-tile";
import { formatHour, hoursLabel } from "@/lib/sauna";

interface DurationPickerProps {
  /** Lengths on offer that day (and for the chosen extras), shortest first. */
  lengths: readonly number[];
  /** Price of a length for the current group and day. */
  price: (hours: number) => number;
  startHour: number;
  /** Longest run available from the start, capped by closing and the next booking. */
  maxHours: number;
  selected: number;
  onSelect: (hours: number) => void;
}

/** Session length from the chosen start, with end time and price on each option. */
export function DurationPicker({ lengths, price, startHour, maxHours, selected, onSelect }: DurationPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {lengths.map((hours) => (
        <ChoiceTile
          key={hours}
          primary={hoursLabel(hours)}
          secondary={`iki ${formatHour(startHour + hours)} · ${price(hours)} €`}
          active={selected === hours}
          disabled={hours > maxHours}
          onClick={() => onSelect(hours)}
        />
      ))}
    </div>
  );
}
