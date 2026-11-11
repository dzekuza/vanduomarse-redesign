"use client";

import { CalendarBlankIcon } from "@phosphor-icons/react";
import { useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { DatePicker } from "./date-picker";
import { longDateLabel } from "@/lib/sauna";

interface DateFieldProps extends Pick<ComponentProps<typeof DatePicker>, "days" | "range" | "icons" | "dayDetails" | "allowFutureDates"> {
  date: Date | null;
  disabled?: boolean;
  open?: boolean;
  label?: string;
  selectionLabel?: string;
  footer?: ReactNode;
  onOpenChange?: (open: boolean) => void;
  onSelect: (date: Date) => void;
  onClear?: () => void;
}

/** Expand the shared calendar from the date field in a public form. */
export function DateField({ date, days, disabled, open, label, range, selectionLabel, icons, dayDetails, allowFutureDates, footer, onOpenChange, onSelect, onClear }: DateFieldProps) {
  const button = useRef<HTMLButtonElement>(null);
  const calendarId = useId();
  const [expanded, setExpanded] = useState(false);
  const isOpen = !disabled && (open ?? expanded);
  const setOpen = onOpenChange ?? setExpanded;

  function close() {
    setOpen(false);
    button.current?.focus({ preventScroll: true });
  }

  function pick(next: Date | null) {
    if (next) onSelect(next);
    else onClear?.();
    if (!range || !next || (range.selectingEnd && date && next > date)) close();
  }

  return (
    <fieldset disabled={disabled} className="min-w-0 disabled:opacity-50">
      <legend className="mb-2 flex items-center gap-2 text-sm font-bold"><CalendarBlankIcon size={18} aria-hidden /> {label ?? (range ? "Datos" : "Data")}</legend>
      <button ref={button} type="button" aria-expanded={isOpen} aria-controls={calendarId} onClick={() => setOpen(!isOpen)} className="flex min-h-11 w-full items-center justify-between gap-3 border border-line px-3 py-2 text-left text-sm enabled:hover:border-ink">
        <span aria-live={range ? "polite" : undefined}>{selectionLabel ?? (date ? longDateLabel(date) : range ? "Pasirink atvykimo datą" : "Pasirink datą")}</span>
        <CalendarBlankIcon size={18} className="shrink-0" aria-hidden />
      </button>
      <div id={calendarId} hidden={!isOpen} className="mt-3 min-w-0 space-y-3">
        {isOpen ? (
          <>
            <DatePicker compact initialView="calendar" days={days} selected={date} range={range} icons={icons} dayDetails={dayDetails} allowFutureDates={allowFutureDates} onSelect={pick} />
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
