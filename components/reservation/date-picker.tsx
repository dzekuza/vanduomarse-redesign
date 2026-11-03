"use client";

import { CalendarBlankIcon, RowsIcon } from "@phosphor-icons/react";
import { useState } from "react";
import type { DayIcon } from "@/components/booking/day-picker";
import { dateKey } from "@/lib/sauna";
import { DayCell } from "./day-cell";
import { MonthCalendar } from "./month-calendar";

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

/** The reservation date picker: a scrolling strip or a month calendar, switched with the toggle above it. */
export function DatePicker({ days, selected, onSelect, icons }: DatePickerProps) {
  const [view, setView] = useState<View>("strip");
  return (
    <div>
      <div role="group" aria-label="Datos rodinys" className="mb-4 inline-flex border border-line">
        {VIEWS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={view === id}
            onClick={() => setView(id)}
            className={`flex min-h-11 items-center gap-2 px-4 text-xs transition-colors duration-150 ease-out-strong ${view === id ? "bg-ink text-dust" : "hover:text-rust"}`}
          >
            <Icon size={16} aria-hidden />
            {label}
          </button>
        ))}
      </div>
      {view === "strip" ? (
        <div className="scrollbar-ink flex gap-1.5 overflow-x-auto pb-3 sm:gap-2">
          {days.map((d) => (
            <DayCell key={dateKey(d)} date={d} active={dateKey(d) === dateKey(selected)} isToday={dateKey(d) === dateKey(days[0])} icons={icons(d)} onSelect={onSelect} />
          ))}
        </div>
      ) : (
        <MonthCalendar days={days} selected={selected} onSelect={onSelect} icons={icons} />
      )}
    </div>
  );
}
