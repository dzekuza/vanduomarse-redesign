"use client";

import { CalendarBlankIcon } from "@phosphor-icons/react";
import { useId, useRef } from "react";
import type { DayIcon } from "@/components/booking/day-picker";
import { DatePicker } from "@/components/reservation/date-picker";
import { longDateLabel } from "@/lib/sauna";

interface ServiceDateFieldProps {
  date: Date | null;
  days: Date[];
  disabled: boolean;
  open: boolean;
  icons: (date: Date) => DayIcon[];
  onOpenChange: (open: boolean) => void;
  onSelect: (date: Date) => void;
}

/** The date field of a service booking panel: expands the shared calendar in place (sauna and quads). */
export function ServiceDateField({ date, days, disabled, open, icons, onOpenChange, onSelect }: ServiceDateFieldProps) {
  const button = useRef<HTMLButtonElement>(null);
  const calendarId = useId();

  return (
    <fieldset disabled={disabled} className="min-w-0 disabled:opacity-50">
      <legend className="mb-2 flex items-center gap-2 text-sm font-bold"><CalendarBlankIcon size={18} aria-hidden /> Data</legend>
      <button ref={button} type="button" aria-expanded={!disabled && open} aria-controls={calendarId} onClick={() => onOpenChange(!open)} className="flex min-h-11 w-full items-center justify-between gap-3 border border-line px-3 py-2 text-left text-sm enabled:hover:border-ink">
        {date ? longDateLabel(date) : "Pasirink datą"}
        <CalendarBlankIcon size={18} className="shrink-0" aria-hidden />
      </button>
      <div id={calendarId} hidden={disabled || !open} className="mt-3">
        {!disabled && open ? <DatePicker compact initialView="calendar" days={days} selected={date} icons={icons} onSelect={(next) => {
          onSelect(next);
          onOpenChange(false);
          button.current?.focus({ preventScroll: true });
        }} /> : null}
      </div>
    </fieldset>
  );
}
