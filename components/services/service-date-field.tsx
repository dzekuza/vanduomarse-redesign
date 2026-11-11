"use client";

import { CalendarBlankIcon } from "@phosphor-icons/react";
import { useId, useRef, type ComponentProps, type ReactNode } from "react";
import type { DayIcon } from "@/components/booking/day-picker";
import type { ReservationDayDetails } from "@/components/reservation/day-cell";
import { DatePicker } from "@/components/reservation/date-picker";
import { longDateLabel } from "@/lib/sauna";

interface ServiceDateFieldProps {
  date: Date | null;
  days: Date[];
  disabled: boolean;
  open: boolean;
  range?: ComponentProps<typeof DatePicker>["range"];
  selectionLabel?: string;
  icons?: (date: Date) => DayIcon[];
  dayDetails?: (date: Date) => ReservationDayDetails | undefined;
  footer?: ReactNode;
  onOpenChange: (open: boolean) => void;
  onSelect: (date: Date) => void;
  onClear?: () => void;
}

/** Expand the shared calendar within the booking panel. */
export function ServiceDateField({ date, days, disabled, open, range, selectionLabel, icons, dayDetails, footer, onOpenChange, onSelect, onClear }: ServiceDateFieldProps) {
  const button = useRef<HTMLButtonElement>(null);
  const calendarId = useId();

  function close() {
    onOpenChange(false);
    button.current?.focus({ preventScroll: true });
  }

  function pick(next: Date | null) {
    if (next) onSelect(next);
    else onClear?.();
    if (!range || !next || (range.selectingEnd && date && next > date)) close();
  }

  return (
    <fieldset disabled={disabled} className="min-w-0 disabled:opacity-50">
      <legend className="mb-2 flex items-center gap-2 text-sm font-bold"><CalendarBlankIcon size={18} aria-hidden /> {range ? "Datos" : "Data"}</legend>
      <button ref={button} type="button" aria-expanded={!disabled && open} aria-controls={calendarId} onClick={() => onOpenChange(!open)} className="flex min-h-11 w-full items-center justify-between gap-3 border border-line px-3 py-2 text-left text-sm enabled:hover:border-ink">
        <span aria-live={range ? "polite" : undefined}>{selectionLabel ?? (date ? longDateLabel(date) : range ? "Pasirink atvykimo datą" : "Pasirink datą")}</span>
        <CalendarBlankIcon size={18} className="shrink-0" aria-hidden />
      </button>
      <div id={calendarId} hidden={disabled || !open} className="mt-3 min-w-0 space-y-3">
        {!disabled && open ? (
          <>
            <DatePicker compact initialView="calendar" days={days} selected={date} range={range} icons={icons} dayDetails={dayDetails} onSelect={pick} />
            {footer}
            {range?.end ? (
              <button type="button" onClick={close} className="flex min-h-11 w-full items-center justify-center bg-ink px-3 text-xs font-bold text-dust">
                Uždaryti kalendorių
              </button>
            ) : null}
            {onClear ? (
              <div className="flex items-center justify-between border-t border-line text-xs font-bold">
                <button type="button" onClick={() => pick(days[0])} className="min-h-11 px-2 enabled:hover:underline">Šiandien</button>
                <button type="button" onClick={() => pick(null)} disabled={!date} className="min-h-11 px-2 enabled:hover:underline disabled:opacity-30">Išvalyti</button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </fieldset>
  );
}
