"use client";

import { useLayoutEffect, useRef } from "react";
import type { DayIcon } from "@/components/booking/day-picker";
import { dateKey } from "@/lib/sauna";
import { canSelectDate, DayCell, rangePart, type DateRangeSelection } from "./day-cell";

const MONTH_LABEL = new Intl.DateTimeFormat("lt-LT", { month: "long" });

interface DateStripProps {
  days: Date[];
  selected: Date | null;
  onSelect: (date: Date) => void;
  icons?: (date: Date) => DayIcon[];
  range?: DateRangeSelection;
  reserveIconSpace?: boolean;
}

export function DateStrip({ days, selected, onSelect, icons, range, reserveIconSpace }: DateStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const last = days.at(-1);
  const lastKey = last && dateKey(last);
  const visibleDays = [...days];
  if (last && range) {
    const through = range.selectingEnd ? range.lastEnd : range.end;
    const extra = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
    while (through && dateKey(extra) <= through) {
      visibleDays.push(new Date(extra));
      extra.setDate(extra.getDate() + 1);
    }
  }

  const months = new Map<string, Date[]>();
  for (const date of visibleDays) {
    const key = dateKey(date).slice(0, 7);
    const month = months.get(key);
    if (month) month.push(date);
    else months.set(key, [date]);
  }

  const selectedKey = selected && dateKey(selected);
  const isRange = Boolean(range);
  const anchorKey = range?.end ?? selectedKey;
  const today = days[0];

  // Bring the active date into view while keeping nearby range days visible.
  useLayoutEffect(() => {
    const strip = stripRef.current;
    const active = anchorKey && strip?.querySelector(`[data-date="${anchorKey}"]`);
    if (!strip || !active) return;
    const viewport = strip.getBoundingClientRect();
    const cell = active.getBoundingClientRect();
    if (cell.left < viewport.left || (!isRange && cell.right > viewport.right)) {
      strip.scrollLeft += cell.left - viewport.left;
    } else if (cell.right > viewport.right) {
      strip.scrollLeft += cell.right - viewport.right;
    }
  }, [anchorKey, isRange]);

  return (
    <div ref={stripRef} className="scrollbar-ink flex gap-4 overflow-x-auto pb-3 sm:gap-5">
      {[...months].map(([key, dates]) => {
        const label = MONTH_LABEL.format(dates[0]);
        return (
          <div key={key} role="group" aria-label={label} className="shrink-0">
            <p aria-hidden className="sticky left-0 mb-3 flex h-12 w-fit items-center whitespace-nowrap text-micro font-bold uppercase text-copy">
              {label}
            </p>
            <div className="flex gap-1.5 sm:gap-2">
              {dates.map((date) => {
                const day = dateKey(date);
                const arrivalAvailable = !lastKey || day <= lastKey;
                return (
                  <DayCell
                    key={day}
                    date={date}
                    active={day === selectedKey}
                    rangePart={rangePart(day, range)}
                    isToday={date === today}
                    disabled={!canSelectDate(day, arrivalAvailable, range)}
                    icons={!arrivalAvailable || (range?.selectingEnd && day > range.start) ? undefined : icons?.(date)}
                    reserveIconSpace={reserveIconSpace}
                    onSelect={onSelect}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
