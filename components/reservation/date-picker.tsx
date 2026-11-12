"use client";

import { CalendarBlankIcon, RowsIcon } from "@phosphor-icons/react";
import { useState, type PointerEvent, type ReactNode } from "react";
import type { DayIcon } from "@/components/booking/day-picker";
import { dateKey } from "@/lib/sauna";
import { DateStrip } from "./date-strip";
import { canSelectDeparture, type DateRangeSelection, type ReservationDayDetails } from "./day-cell";
import { MonthCalendar, monthStart } from "./month-calendar";

type View = "strip" | "calendar";

interface DatePickerProps {
  days: Date[];
  selected: Date | null;
  onSelect: (date: Date) => void;
  icons?: (date: Date) => DayIcon[];
  dayDetails?: (date: Date, view: View) => ReservationDayDetails | undefined;
  initialView?: View;
  /** Label alongside the view switch when the picker is always visible. */
  label?: ReactNode;
  wideStrip?: boolean;
  /** Use the same views in a narrow booking panel. */
  compact?: boolean;
  /** Inquiries can select future dates beyond the dates in the strip. */
  allowFutureDates?: boolean;
  /** `selected` is the arrival. The end defaults to the following day. */
  range?: { end: Date | null; selectingEnd: boolean; lastEnd: Date };
}

const VIEWS: { id: View; label: string; Icon: typeof RowsIcon }[] = [
  { id: "strip", label: "Juosta", Icon: RowsIcon },
  { id: "calendar", label: "Kalendorius", Icon: CalendarBlankIcon },
];

/** A scrolling strip or a month calendar, switched with the toggle above it. */
export function DatePicker({ days, selected, onSelect, icons, dayDetails, initialView = "strip", label, wideStrip, compact, allowFutureDates, range }: DatePickerProps) {
  const [view, setView] = useState(initialView);
  const [browsedMonth, setBrowsedMonth] = useState<Date>();
  const [preview, setPreview] = useState<{ start: string; end: string }>();
  const selectedKey = selected && dateKey(selected);
  const selection: DateRangeSelection | undefined = range && selected ? {
    start: dateKey(selected),
    end: range.end && dateKey(range.end),
    lastEnd: dateKey(range.lastEnd),
    selectingEnd: range.selectingEnd,
    previewEnd: range.selectingEnd && preview?.start === selectedKey ? preview.end : undefined,
  } : undefined;
  const calendarStart = range?.end ?? selected ?? days[0];
  const calendarMonth = browsedMonth ?? (calendarStart && monthStart(calendarStart));
  const detailsForView = dayDetails && ((date: Date) => dayDetails(date, view));
  const reserveIconSpace = Boolean(range && (icons || dayDetails));

  function selectDay(date: Date) {
    if (range && view === "calendar" && calendarMonth) setBrowsedMonth(calendarMonth);
    setPreview(undefined);
    onSelect(date);
  }

  function previewDeparture(event: PointerEvent<HTMLDivElement>) {
    if (!selection?.selectingEnd || event.pointerType !== "mouse") return;
    const end = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("button[data-date]")?.dataset.date : undefined;
    if (!end || !canSelectDeparture(end, selection)) {
      setPreview(undefined);
    } else if (end !== preview?.end || selection.start !== preview.start) {
      setPreview({ start: selection.start, end });
    }
  }

  function changeView(next: View) {
    if (next === view) return;
    if (next === "calendar") setBrowsedMonth(undefined);
    setPreview(undefined);
    setView(next);
  }

  const inlineControls = compact || Boolean(label);
  const controlsClass = inlineControls
    ? "mb-2 flex flex-wrap items-start justify-between gap-2"
    : view === "strip"
      ? "absolute top-0 right-0 z-10 flex h-12 items-center bg-dust pl-3"
      : "mb-4 flex justify-end";

  return (
    <div onPointerOver={selection?.selectingEnd ? previewDeparture : undefined} onPointerLeave={selection?.selectingEnd ? () => setPreview(undefined) : undefined} className="relative">
      <div className={controlsClass}>
        {label}
        <div role="group" aria-label="Datos rodinys" className={`inline-flex shrink-0 border border-line ${inlineControls ? "ml-auto" : ""}`}>
          {VIEWS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              onClick={() => changeView(id)}
              className={`flex min-h-11 items-center gap-1.5 px-2 text-xs transition-colors duration-150 ease-out-strong ${inlineControls ? "" : "sm:gap-2 sm:px-4"} ${view === id ? "bg-ink text-dust" : "hover:text-rust"}`}
            >
              <Icon size={16} aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>
      {view === "strip" ? (
        <DateStrip days={days} selected={selected} onSelect={selectDay} icons={icons} dayDetails={detailsForView} range={selection} reserveIconSpace={reserveIconSpace} compact={compact} wideDays={wideStrip} />
      ) : calendarMonth && (
        <MonthCalendar
          days={days}
          selected={selected}
          onSelect={selectDay}
          icons={icons}
          dayDetails={detailsForView}
          allowFutureDates={allowFutureDates}
          range={selection}
          reserveIconSpace={reserveIconSpace}
          compact={compact}
          month={calendarMonth}
          onMonthChange={(month) => {
            setPreview(undefined);
            setBrowsedMonth(month);
          }}
        />
      )}
    </div>
  );
}
