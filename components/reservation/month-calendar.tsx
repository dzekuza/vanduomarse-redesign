"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import type { DayIcon } from "@/components/booking/day-picker";
import { dateKey, nextDays } from "@/lib/sauna";
import { canSelectDate, DayCell, rangePart, type DateRangeSelection, type ReservationDayDetails } from "./day-cell";

interface MonthCalendarProps {
  /** The dates open for booking, shared with the strip. */
  days: Date[];
  selected: Date | null;
  onSelect: (date: Date) => void;
  icons?: (date: Date) => DayIcon[];
  dayDetails?: (date: Date) => ReservationDayDetails | undefined;
  allowFutureDates?: boolean;
  range?: DateRangeSelection;
  reserveIconSpace?: boolean;
  compact?: boolean;
  month: Date;
  onMonthChange: (month: Date) => void;
}

/** Monday-first weekday headings, matching the grid below. */
const HEADINGS = ["Pr", "An", "Tr", "Kt", "Pn", "Št", "Sk"];
const MONTH_LABEL = new Intl.DateTimeFormat("lt-LT", { month: "long" });
const BOOKING_DATE_LABEL = new Intl.DateTimeFormat("lt-LT", { year: "numeric", month: "long", day: "numeric" });
const BROWSE_MONTHS = 12;

export const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

function keyboardDate(date: Date, key: string): Date | undefined {
  const weekday = (date.getDay() + 6) % 7;
  const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -weekday, End: 6 - weekday };
  const offset = offsets[key];
  if (offset !== undefined) return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
  if (key === "PageUp" || key === "PageDown") return new Date(date.getFullYear(), date.getMonth() + (key === "PageUp" ? -1 : 1), 1);
}

/** A month grid of the same day cells; days that can't be booked are greyed out. */
export function MonthCalendar({ days, selected, onSelect, icons, dayDetails, allowFutureDates, range, reserveIconSpace, compact, month, onMonthChange }: MonthCalendarProps) {
  const grid = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);
  const [focusedKey, setFocusedKey] = useState<string>();
  const departure = range?.selectingEnd ? range : undefined;
  const firstDay = days[0];
  const first = monthStart(firstDay ?? selected ?? month);
  const bookingEnd = days.at(-1);
  const last = new Date(first.getFullYear(), first.getMonth() + BROWSE_MONTHS - 1, 1);
  const bookable = new Set(days.map(dateKey));
  const selectedKey = selected && dateKey(selected);
  const today = firstDay ? dateKey(firstDay) : null;
  const offset = (month.getDay() + 6) % 7;
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const count = monthEnd.getDate();
  const cells = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: count }, (_, i) => dayState(new Date(month.getFullYear(), month.getMonth(), i + 1))),
  ];
  const shift = (by: number) => onMonthChange(new Date(month.getFullYear(), month.getMonth() + by, 1));
  const enabledKeys = cells.flatMap((cell) => cell && !cell.disabled ? [cell.key] : []);
  const preferredKey = focusedKey ?? range?.end ?? selectedKey ?? today;
  const tabStop = preferredKey && enabledKeys.includes(preferredKey) ? preferredKey : enabledKeys[0];

  useLayoutEffect(() => {
    if (!moveFocus.current || !focusedKey) return;
    moveFocus.current = false;
    grid.current?.querySelector<HTMLButtonElement>(`[data-date="${focusedKey}"]`)?.focus();
  }, [focusedKey, month]);

  function dayState(date: Date) {
    const key = dateKey(date);
    const canSelect = canSelectDate(key, allowFutureDates && today ? key >= today : bookable.has(key), range);
    const showDetails = canSelect && (!departure || key <= departure.start);
    const details = showDetails ? dayDetails?.(date) : undefined;
    return { date, key, showDetails, details, disabled: !canSelect || details?.disabled === true };
  }

  function navigateDays(event: KeyboardEvent<HTMLDivElement>) {
    const key = event.target instanceof HTMLButtonElement ? event.target.dataset.date : undefined;
    if (!key) return;
    let next = keyboardDate(nextDays(key, 1)[0], event.key);
    if (!next) return;
    event.preventDefault();
    if (range && firstDay && event.key === "PageUp" && next.getTime() === first.getTime()) next = firstDay;
    const nextKey = dateKey(next);
    if (nextKey === key || dayState(next).disabled) return;
    const nextMonth = monthStart(next);
    if (nextMonth.getTime() !== month.getTime()) {
      moveFocus.current = true;
      onMonthChange(nextMonth);
    } else {
      grid.current?.querySelector<HTMLButtonElement>(`[data-date="${nextKey}"]`)?.focus();
    }
    setFocusedKey(nextKey);
  }

  return (
    <div className={`border border-line bg-foam/15 px-1 py-4 ${compact ? "" : "sm:p-5"}`}>
      <div role="group" aria-label="Mėnesio navigacija" className="mb-3 flex items-center justify-between gap-2">
        <button type="button" aria-label="Ankstesnis mėnuo" disabled={month <= first} onClick={() => shift(-1)} className="flex size-11 shrink-0 items-center justify-center border border-line hover:border-rust disabled:opacity-30">
          <CaretLeftIcon size={18} aria-hidden />
        </button>
        <p aria-live="polite" className="text-center text-micro font-bold uppercase text-copy">
          {MONTH_LABEL.format(month)} <span className="whitespace-nowrap">{month.getFullYear()}</span>
        </p>
        <button type="button" aria-label="Kitas mėnuo" disabled={!allowFutureDates && month >= last} onClick={() => shift(1)} className="flex size-11 shrink-0 items-center justify-center border border-line hover:border-rust disabled:opacity-30">
          <CaretRightIcon size={18} aria-hidden />
        </button>
      </div>
      {!allowFutureDates && bookingEnd && monthEnd > bookingEnd ? (
        <p className="mb-3 text-xs text-copy">{reserveIconSpace ? "Atvykti" : "Rezervuoti"} galima iki {BOOKING_DATE_LABEL.format(bookingEnd)} imtinai.</p>
      ) : null}
      <div ref={grid} role="group" aria-label="Mėnesio dienos" onKeyDown={navigateDays} className={`grid grid-cols-7 gap-0.5 ${compact ? "" : "sm:gap-1.5"}`}>
        {HEADINGS.map((h) => (
          <span key={h} aria-hidden className="pb-1 text-center text-micro uppercase text-copy">
            {h}
          </span>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <span key={`blank-${i}`} aria-hidden />;
          const { date, key, disabled, showDetails, details } = cell;
          return (
            <DayCell
              key={key}
              fluid
              compact={compact}
              date={date}
              active={key === selectedKey}
              rangePart={rangePart(key, range)}
              isToday={key === today}
              disabled={disabled}
              tabIndex={key === tabStop ? 0 : -1}
              icons={showDetails ? icons?.(date) : undefined}
              details={details}
              reserveIconSpace={reserveIconSpace}
              onSelect={(date) => {
                setFocusedKey(key);
                onSelect(date);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
