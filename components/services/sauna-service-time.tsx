"use client";

import { ClockIcon } from "@phosphor-icons/react";
import { useId } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SessionRow } from "@/lib/reservation";
import { formatHour } from "@/lib/sauna";

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
  // A sauna with several private programs lists each program's starts, named after it, so choosing the time also chooses the program.
  const several = rows.filter((row) => row.mode === "private").length > 1;
  const options = rows.flatMap<TimeOption>((row) => row.mode === "private"
    ? (row.startHours ?? []).map((hour) => ({ row, value: `${row.programId}:${hour}`, label: several ? `${formatHour(hour)} · ${row.title}` : formatHour(hour), hour }))
    : [{ row, value: row.key, label: `${row.time} · ${row.title}`, hour: null }]);
  const selected = options.find((option) => option.value === value);
  const hasFreeTime = options.some(({ row }) => !row.blocked);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-bold"><ClockIcon size={18} aria-hidden /> Laikas</label>
      <Select value={selected?.value ?? ""} disabled={busy || options.length === 0} onValueChange={(next) => {
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
                    <span className={row.blocked ? "font-bold text-rust-ink" : "font-bold"}>Laisvų vietų · {row.maxPeople}</span>
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
