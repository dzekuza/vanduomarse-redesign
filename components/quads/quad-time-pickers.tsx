"use client";

import { ChoiceTile } from "@/components/booking/choice-tile";
import { hourLabel, longestFrom, rentalPrice, type QuadSettings, type QuadTaken, type QuadType } from "@/lib/quads";
import { hoursLabel } from "@/lib/sauna";

interface PickerContext {
  type: QuadType;
  units: number;
  settings: QuadSettings;
  taken: QuadTaken;
  /** yyyy-mm-dd */
  day: string;
}

interface StartGridProps extends PickerContext {
  /** Hours up to and including this one are over for today; -1 for any other day. */
  pastHour: number;
  selected: number | null;
  onSelect: (hour: number) => void;
}

/** Hourly start times; a start is open only while `units` quads stay free for at least an hour from it. */
export function StartGrid({ type, units, settings, taken, day, pastHour, selected, onSelect }: StartGridProps) {
  const hours = Array.from({ length: settings.closeHour - settings.openHour }, (_, i) => settings.openHour + i);
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {hours.map((h) => {
        const longest = h <= pastHour ? 0 : longestFrom(type, taken, day, h, units, settings);
        return (
          <ChoiceTile
            key={h}
            primary={hourLabel(h)}
            secondary={longest === 0 ? "Užimta" : `iki ${hoursLabel(longest)}`}
            active={selected === h}
            disabled={longest === 0}
            onClick={() => onSelect(h)}
          />
        );
      })}
    </div>
  );
}

interface DurationGridProps extends PickerContext {
  startHour: number;
  selected: number;
  onSelect: (hours: number) => void;
}

/** Rental length from the chosen start, with end time and price on each option. */
export function DurationGrid({ type, units, settings, taken, day, startHour, selected, onSelect }: DurationGridProps) {
  const longest = longestFrom(type, taken, day, startHour, units, settings);
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {Array.from({ length: settings.maxHours }, (_, i) => i + 1).map((h) => (
        <ChoiceTile
          key={h}
          primary={hoursLabel(h)}
          secondary={`iki ${hourLabel(startHour + h)} · ${rentalPrice(type, h, units)} €`}
          active={selected === h}
          disabled={h > longest}
          onClick={() => onSelect(h)}
        />
      ))}
    </div>
  );
}
