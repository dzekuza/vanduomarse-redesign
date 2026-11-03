"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useState } from "react";
import type { DayIcon } from "@/components/booking/day-picker";
import { dateKey } from "@/lib/sauna";
import { DayCell } from "./day-cell";

interface MonthCalendarProps {
  /** The days that can be booked, consecutive from today. */
  days: Date[];
  selected: Date;
  onSelect: (date: Date) => void;
  icons: (date: Date) => DayIcon[];
}

/** Monday-first weekday headings, matching the grid below. */
const HEADINGS = ["Pr", "An", "Tr", "Kt", "Pn", "Št", "Sk"];

const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const monthLabel = (d: Date) => new Intl.DateTimeFormat("lt-LT", { month: "long", year: "numeric" }).format(d);

/** A month grid of the same day cells; days that can't be booked are greyed out. */
export function MonthCalendar({ days, selected, onSelect, icons }: MonthCalendarProps) {
  const [month, setMonth] = useState(() => monthStart(selected));
  const first = monthStart(days[0]);
  const last = monthStart(days[days.length - 1]);
  const bookable = new Set(days.map(dateKey));
  const offset = (month.getDay() + 6) % 7;
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array.from({ length: offset }, () => null), ...Array.from({ length: count }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  const shift = (by: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + by, 1));

  return (
    <div className="border border-line bg-foam/15 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" aria-label="Ankstesnis mėnuo" disabled={month <= first} onClick={() => shift(-1)} className="flex size-11 items-center justify-center border border-line hover:border-rust disabled:opacity-30">
          <CaretLeftIcon size={18} />
        </button>
        <p aria-live="polite" className="text-sm font-bold tracking-tight">
          {monthLabel(month)}
        </p>
        <button type="button" aria-label="Kitas mėnuo" disabled={month >= last} onClick={() => shift(1)} className="flex size-11 items-center justify-center border border-line hover:border-rust disabled:opacity-30">
          <CaretRightIcon size={18} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {HEADINGS.map((h) => (
          <span key={h} aria-hidden className="pb-1 text-center text-micro uppercase text-lake-soft">
            {h}
          </span>
        ))}
        {cells.map((d, i) =>
          d ? (
            <DayCell
              key={dateKey(d)}
              fluid
              date={d}
              active={dateKey(d) === dateKey(selected)}
              isToday={dateKey(d) === dateKey(days[0])}
              disabled={!bookable.has(dateKey(d))}
              icons={icons(d)}
              onSelect={onSelect}
            />
          ) : (
            <span key={`blank-${i}`} aria-hidden />
          ),
        )}
      </div>
    </div>
  );
}
