"use client";

import { ClockIcon } from "@phosphor-icons/react";
import { FilterChip } from "@/components/events/filter-chip";
import { formatHour } from "@/lib/sauna";

interface SaunaServiceTimeProps {
  hours: readonly number[];
  selected: number | null;
  busy: boolean;
  onSelect: (hour: number) => void;
}

/** Available starts for the selected private sauna, date and duration. */
export function SaunaServiceTime({ hours, selected, busy, onSelect }: SaunaServiceTimeProps) {
  return (
    <fieldset disabled={busy} className="min-w-0 space-y-2">
      <legend className="flex items-center gap-2 text-sm font-bold">
        <ClockIcon size={18} aria-hidden /> Pradžia
      </legend>
      {hours.length > 0 ? (
        <div className="grid grid-cols-4 gap-2">
          {hours.map((hour) => (
            <FilterChip
              key={hour}
              active={hour === selected}
              onClick={() => onSelect(hour)}
              className="min-w-0 justify-center px-1 font-bold tabular-nums"
            >
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
