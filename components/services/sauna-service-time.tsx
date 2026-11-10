"use client";

import { ClockIcon } from "@phosphor-icons/react";
import { useId } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SessionRow } from "@/lib/reservation";
import { formatHour } from "@/lib/sauna";
import { AvailabilityCount } from "./availability-count";

interface TimeOption {
  row: SessionRow;
  value: string;
  label: string;
  hour: number | null;
}

interface SaunaServiceTimeProps {
  rows: SessionRow[];
  value: string | undefined;
  busy: boolean;
  dateSelected: boolean;
  onSelect: (row: SessionRow, hour: number | null) => void;
}

/** Show the remaining seats beside each published session while choosing a time. */
export function SaunaServiceTime({ rows, value, busy, dateSelected, onSelect }: SaunaServiceTimeProps) {
  const id = useId();
  const options = rows.flatMap<TimeOption>((row) => row.mode === "private"
    ? (row.startHours ?? []).map((hour) => ({ row, value: String(hour), label: formatHour(hour), hour }))
    : [{ row, value: row.key, label: `${row.time} · ${row.title}`, hour: null }]);
  const selected = options.find((option) => option.value === value);
  const hasFreeTime = options.some(({ row }) => !row.blocked);
  const disabled = busy || !dateSelected || options.length === 0;

  return (
    <div className="space-y-2">
      <label htmlFor={id} data-disabled={disabled || undefined} className="flex items-center gap-2 text-sm font-bold data-disabled:opacity-50"><ClockIcon size={18} aria-hidden /> Laikas</label>
      <Select value={selected?.value ?? ""} disabled={disabled} onValueChange={(next) => {
        const option = options.find((item) => item.value === next);
        if (option && !option.row.blocked) onSelect(option.row, option.hour);
      }}>
        <SelectTrigger id={id} className="w-full rounded-none border-line bg-transparent">
          <SelectValue placeholder="Pasirink laiką" className="min-w-0 overflow-hidden">{selected?.label}</SelectValue>
        </SelectTrigger>
        <SelectContent position="popper" className="max-w-(--radix-select-trigger-width)">
          {options.map(({ row, value, label }) => (
            <SelectItem key={value} value={value} textValue={label} disabled={row.blocked} className="min-h-11 whitespace-normal data-disabled:opacity-100">
              {row.mode === "session" ? (
                <span className="grid gap-1 py-1">
                  <span className="font-bold">{row.title}</span>
                  <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
                    <span className="text-copy">{row.time}</span>
                    <span>Laisvų vietų · <AvailabilityCount free={row.maxPeople} capacity={row.capacity} /></span>
                  </span>
                </span>
              ) : label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {dateSelected && !hasFreeTime ? (
        <p role="status" className="text-xs text-copy">
          {options.length ? "Šios dienos seansų vietos užimtos." : "Šią dieną laisvų laikų nėra."} Pasirink kitą datą.
        </p>
      ) : null}
    </div>
  );
}
