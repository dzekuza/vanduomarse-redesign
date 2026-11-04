"use client";

import { CalendarBlankIcon, RowsIcon } from "@phosphor-icons/react";
import { useLayoutEffect, useRef, useState } from "react";
import type { DayIcon } from "@/components/booking/day-picker";
import { dateKey } from "@/lib/sauna";
import { DayCell } from "./day-cell";
import { MonthCalendar, monthStart } from "./month-calendar";

interface DatePickerProps {
  days: Date[];
  selected: Date;
  onSelect: (date: Date) => void;
  icons: (date: Date) => DayIcon[];
}

type View = "strip" | "calendar";

const VIEWS: { id: View; label: string; Icon: typeof RowsIcon }[] = [
  { id: "strip", label: "Juosta", Icon: RowsIcon },
  { id: "calendar", label: "Kalendorius", Icon: CalendarBlankIcon },
];

const MONTH_LABEL = new Intl.DateTimeFormat("lt-LT", { month: "long" });

function DateStrip({ days, selected, onSelect, icons }: DatePickerProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const months = new Map<string, Date[]>();
  for (const date of days) {
    const key = dateKey(date).slice(0, 7);
    const month = months.get(key);
    if (month) month.push(date);
    else months.set(key, [date]);
  }

  const selectedKey = dateKey(selected);
  const today = days[0];

  // Restore a date picked in the calendar when it falls inside the shorter strip.
  useLayoutEffect(() => {
    const strip = stripRef.current;
    const active = strip?.querySelector('button[aria-pressed="true"]');
    if (!strip || !active) return;
    const viewport = strip.getBoundingClientRect();
    const cell = active.getBoundingClientRect();
    if (cell.left < viewport.left || cell.right > viewport.right) {
      strip.scrollLeft += cell.left - viewport.left;
    }
  }, [selectedKey]);

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
                return (
                  <DayCell
                    key={day}
                    date={date}
                    active={day === selectedKey}
                    isToday={date === today}
                    icons={icons(date)}
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

/** The reservation date picker: a scrolling strip or a month calendar, switched with the toggle above it. */
export function DatePicker({ days, selected, onSelect, icons }: DatePickerProps) {
  const [view, setView] = useState<View>("strip");
  const [calendarMonth, setCalendarMonth] = useState(() => monthStart(selected));

  function changeView(next: View) {
    if (next === view) return;
    if (next === "calendar") setCalendarMonth(monthStart(selected));
    setView(next);
  }

  return (
    <div className="relative">
      <div className={view === "strip" ? "absolute top-0 right-0 z-10 flex h-12 items-center bg-dust pl-3" : "mb-4 flex items-center justify-between gap-2"}>
        {view === "calendar" && (
          <p aria-live="polite" className="text-micro font-bold uppercase text-copy">
            {MONTH_LABEL.format(calendarMonth)} <span className="whitespace-nowrap">{calendarMonth.getFullYear()}</span>
          </p>
        )}
        <div role="group" aria-label="Datos rodinys" className="inline-flex shrink-0 border border-line">
          {VIEWS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              onClick={() => changeView(id)}
              className={`flex min-h-11 items-center gap-1.5 px-2 text-xs transition-colors duration-150 ease-out-strong sm:gap-2 sm:px-4 ${view === id ? "bg-ink text-dust" : "hover:text-rust"}`}
            >
              <Icon size={16} aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>
      {view === "strip" ? (
        <DateStrip days={days} selected={selected} onSelect={onSelect} icons={icons} />
      ) : (
        <MonthCalendar
          days={days}
          selected={selected}
          onSelect={onSelect}
          icons={icons}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
        />
      )}
    </div>
  );
}
