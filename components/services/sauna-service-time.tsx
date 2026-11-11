"use client";

import { ClockIcon } from "@phosphor-icons/react";
import { FilterChip } from "@/components/events/filter-chip";
import { formatHour } from "@/lib/sauna";
import { cn } from "@/lib/utils";

interface SaunaServiceTimeProps {
  startHours: number[];
  value: number | null;
  busy: boolean;
  dateSelected: boolean;
  onSelect: (hour: number) => void;
}

/** Available start times for private sauna hire. */
export function SaunaServiceTime({ startHours, value, busy, dateSelected, onSelect }: SaunaServiceTimeProps) {
  return (
    <fieldset disabled={busy} className="min-w-0">
      <legend className={cn("mb-2 flex items-center gap-2 text-sm font-bold", !dateSelected && "text-copy")}>
        <ClockIcon size={18} aria-hidden /> Pradžios laikas
      </legend>
      {!dateSelected ? (
        <p className="text-xs text-copy">Pirmiausia pasirink datą.</p>
      ) : startHours.length ? (
        <div className="grid grid-cols-4 gap-1.5">
          {startHours.map((hour) => (
            <FilterChip key={hour} active={hour === value} onClick={() => onSelect(hour)}
              className="min-w-0 justify-center whitespace-nowrap px-1 font-bold tabular-nums">
              {formatHour(hour)}
            </FilterChip>
          ))}
        </div>
      ) : (
        <p role="status" className="text-xs text-copy">Šią dieną laisvų laikų nėra. Pasirink kitą datą.</p>
      )}
    </fieldset>
  );
}
