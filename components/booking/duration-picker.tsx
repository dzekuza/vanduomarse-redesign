"use client";

import { ChoiceTile } from "./choice-tile";
import { formatHour, hoursLabel } from "@/lib/sauna";

const money = (n: number) => `${String(n).replace(".", ",")} €`;

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

/** Session length from the chosen start: one row of tiles with the price on each, and the end time of the chosen one below. */
export function DurationPicker({ lengths, price, startHour, maxHours, selected, onSelect }: DurationPickerProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {lengths.map((hours) => (
          <ChoiceTile
            key={hours}
            primary={hoursLabel(hours)}
            secondary={money(price(hours))}
            active={selected === hours}
            disabled={hours > maxHours}
            onClick={() => onSelect(hours)}
          />
        ))}
      </div>
      {selected > 0 ? <p className="text-xs text-copy">Seansas {formatHour(startHour)}–{formatHour(startHour + selected)}</p> : null}
    </div>
  );
}
