"use client";

import { ClockIcon } from "@phosphor-icons/react";
import { useId } from "react";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimeSelectContent, TimeSelectOption } from "@/components/booking/time-select";
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
        <TimeSelectContent>
          {options.map(({ row, value, label }) => (
            <TimeSelectOption
              key={value}
              value={value}
              time={row.mode === "session" ? row.time : label}
              title={row.mode === "session" ? row.title : undefined}
              disabled={row.blocked}
              status={row.mode === "session" ? (
                <span>Laisvų vietų · <AvailabilityCount free={row.maxPeople} capacity={row.capacity} binary /></span>
              ) : <span className="font-bold text-availability-open!">Laisva</span>}
            />
          ))}
        </TimeSelectContent>
      </Select>
      {dateSelected && !hasFreeTime ? (
        <p role="status" className="text-xs text-copy">
          {options.length ? "Šios dienos seansų vietos užimtos." : "Šią dieną laisvų laikų nėra."} Pasirink kitą datą.
        </p>
      ) : null}
    </div>
  );
}
