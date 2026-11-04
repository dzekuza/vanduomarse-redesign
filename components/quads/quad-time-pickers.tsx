"use client";

import { ChoiceTile } from "@/components/booking/choice-tile";
import { fleetRentalPrice, hourLabel, longestForFleet, type QuadRentalItem, type QuadSettings, type QuadTaken } from "@/lib/quads";
import { hoursLabel } from "@/lib/sauna";

interface PickerContext {
  items: readonly QuadRentalItem[];
  settings: QuadSettings;
  taken: QuadTaken;
  /** yyyy-mm-dd */
  day: string;
  busy?: readonly number[];
}

interface StartGridProps extends PickerContext {
  /** Hours up to and including this one are over for today; -1 for any other day. */
  pastHour: number;
  selected: number | null;
  onSelect: (hour: number) => void;
}

/** Hourly start times; a start is open only if all requested quads are free for at least an hour. */
export function StartGrid({ items, settings, taken, day, busy, pastHour, selected, onSelect }: StartGridProps) {
  const hours = Array.from({ length: settings.closeHour - settings.openHour }, (_, i) => settings.openHour + i);
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {hours.map((h) => {
        const longest = h <= pastHour ? 0 : longestForFleet(items, taken, day, h, settings, busy);
        return (
          <ChoiceTile
            key={h}
            primary={hourLabel(h)}
            secondary={longest === 0 ? (busy?.includes(h) ? "Šiuo metu būsite užimti" : "Užimta") : `iki ${hoursLabel(longest)}`}
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
export function DurationGrid({ items, settings, taken, day, busy, startHour, selected, onSelect }: DurationGridProps) {
  const longest = longestForFleet(items, taken, day, startHour, settings, busy);
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {Array.from({ length: settings.maxHours }, (_, i) => i + 1).map((h) => (
        <ChoiceTile
          key={h}
          primary={hoursLabel(h)}
          secondary={`iki ${hourLabel(startHour + h)} · ${fleetRentalPrice(items, h)} €`}
          active={selected === h}
          disabled={h > longest}
          onClick={() => onSelect(h)}
        />
      ))}
    </div>
  );
}
