"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import type { DayIcon } from "@/components/booking/day-picker";
import { dateKey } from "@/lib/sauna";
import { DayCell } from "./day-cell";

interface MonthCalendarProps {
  /** The dates open for booking, shared with the strip. */
  days: Date[];
  selected: Date;
  onSelect: (date: Date) => void;
  icons: (date: Date) => DayIcon[];
  month: Date;
  onMonthChange: (month: Date) => void;
}

/** Monday-first weekday headings, matching the grid below. */
const HEADINGS = ["Pr", "An", "Tr", "Kt", "Pn", "Št", "Sk"];
const BOOKING_DATE_LABEL = new Intl.DateTimeFormat("lt-LT", { year: "numeric", month: "long", day: "numeric" });
const BROWSE_MONTHS = 12;

export const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

/** A month grid of the same day cells; days that can't be booked are greyed out. */
export function MonthCalendar({ days, selected, onSelect, icons, month, onMonthChange }: MonthCalendarProps) {
  const first = monthStart(days[0] ?? selected);
  const last = new Date(first.getFullYear(), first.getMonth() + BROWSE_MONTHS - 1, 1);
  const bookable = new Set(days.map(dateKey));
  const bookingEnd = days.at(-1);
  const selectedKey = dateKey(selected);
  const today = days[0] ? dateKey(days[0]) : null;
  const offset = (month.getDay() + 6) % 7;
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const count = monthEnd.getDate();
  const cells = [...Array.from({ length: offset }, () => null), ...Array.from({ length: count }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  const shift = (by: number) => onMonthChange(new Date(month.getFullYear(), month.getMonth() + by, 1));

  return (
    <div className="border border-line bg-foam/15 p-4 sm:p-5">
      <div role="group" aria-label="Mėnesio navigacija" className="mb-3 flex items-center justify-between">
        <button type="button" aria-label="Ankstesnis mėnuo" disabled={month <= first} onClick={() => shift(-1)} className="flex size-11 items-center justify-center border border-line hover:border-rust disabled:opacity-30">
          <CaretLeftIcon size={18} aria-hidden />
        </button>
        <button type="button" aria-label="Kitas mėnuo" disabled={month >= last} onClick={() => shift(1)} className="flex size-11 items-center justify-center border border-line hover:border-rust disabled:opacity-30">
          <CaretRightIcon size={18} aria-hidden />
        </button>
      </div>
      {bookingEnd && monthEnd > bookingEnd ? (
        <p className="mb-3 text-xs text-copy">Rezervuoti galima iki {BOOKING_DATE_LABEL.format(bookingEnd)} imtinai.</p>
      ) : null}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {HEADINGS.map((h) => (
          <span key={h} aria-hidden className="pb-1 text-center text-micro uppercase text-copy">
            {h}
          </span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={`blank-${i}`} aria-hidden />;
          const key = dateKey(date);
          const disabled = !bookable.has(key);
          return (
            <DayCell
              key={key}
              fluid
              date={date}
              active={key === selectedKey}
              isToday={key === today}
              disabled={disabled}
              icons={disabled ? [] : icons(date)}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </div>
  );
}
