"use client";

import { useId, type ReactNode } from "react";
import type { DayIcon } from "@/components/booking/day-picker";
import { dateKey, longDateLabel, weekdayLabel } from "@/lib/sauna";

export interface ReservationDayDetails {
  label: string;
  available: boolean;
  /** An explicit booking restriction for this day. */
  disabled?: boolean;
  indicator?: ReactNode;
  opensDialog?: boolean;
  /** Interactive controls are rendered alongside, never inside, the date button. */
  actions?: ReactNode;
}

export interface DateRangeSelection {
  start: string;
  end: string | null;
  lastEnd: string;
  selectingEnd: boolean;
  previewEnd?: string;
}

type RangePart = "arrival" | "departure" | "between";

export function rangePart(day: string, range?: DateRangeSelection): RangePart | undefined {
  if (!range) return;
  if (day === range.start) return "arrival";
  if (day === range.end) return "departure";
  if (day > range.start && ((range.end && day < range.end) || (range.previewEnd && day <= range.previewEnd))) return "between";
}

export function canSelectDeparture(day: string, range: DateRangeSelection): boolean {
  return day > range.start && day <= range.lastEnd;
}

export function canSelectDate(day: string, arrivalAvailable: boolean, range?: DateRangeSelection): boolean {
  return range?.selectingEnd && day > range.start ? canSelectDeparture(day, range) : arrivalAvailable;
}

interface DayCellProps {
  date: Date;
  active: boolean;
  isToday: boolean;
  /** Outside the days that can be chosen for the current step. */
  disabled?: boolean;
  rangePart?: RangePart;
  icons?: DayIcon[];
  details?: ReservationDayDetails;
  reserveIconSpace?: boolean;
  onSelect: (date: Date) => void;
  /** Fills its grid cell instead of the strip's fixed width. */
  fluid?: boolean;
  compact?: boolean;
  tabIndex?: number;
}

/** One day: weekday, big number, a dot for today and the sauna / stay / quad availability marks. */
export function DayCell({ date, active, isToday, disabled, rangePart, icons, details, reserveIconSpace, onSelect, fluid, compact, tabIndex }: DayCellProps) {
  const descriptionId = useId();
  const anyFree = details?.available ?? (!icons || icons.some((i) => i.on));
  const endpoint = rangePart === "arrival" ? "Atvykimas" : rangePart === "departure" ? "Išvykimas" : undefined;
  const selected = active || Boolean(endpoint);
  const compactMonth = compact && fluid;
  const hasActions = !disabled && Boolean(details?.actions);
  const appearance = selected
    ? "border-ink bg-foam/50 text-ink"
    : rangePart === "between"
      ? "border-ink/30 bg-foam text-ink hover:border-ink"
      : disabled
        ? "border-line bg-foam/50 text-ink/25"
        : anyFree
          ? "border-line bg-foam/50 text-ink hover:border-ink"
          : "border-line bg-foam/50 text-ink/45 hover:border-ink";
  const button = (
    <button
      type="button"
      onClick={() => onSelect(date)}
      disabled={disabled}
      tabIndex={tabIndex}
      data-date={dateKey(date)}
      aria-pressed={selected}
      aria-label={`${endpoint ? `${endpoint}, ` : ""}${compactMonth ? "" : `${weekdayLabel(date)} `}${longDateLabel(date)}`}
      aria-describedby={details ? descriptionId : undefined}
      aria-haspopup={details?.opensDialog ? "dialog" : undefined}
      className={`relative flex min-h-11 flex-col items-center border text-sm transition-[color,background-color,border-color,scale] duration-150 ease-out-strong motion-safe:active:scale-97 ${compact ? "justify-center gap-0.5 py-1" : "gap-1 py-2.5 sm:py-3"} ${
        fluid ? "w-full" : compact ? "w-12 shrink-0" : "w-14 shrink-0 sm:w-16"
      } ${hasActions ? "border-transparent" : appearance} ${disabled ? "cursor-not-allowed" : ""}${details ? " min-w-0" : ""}`}
    >
      {isToday && !disabled ? <span aria-hidden className={`absolute rounded-full bg-current ${compactMonth ? "right-0.5 top-0.5 size-1" : "right-1.5 top-1.5 size-1.5"}`} /> : null}
      {!compactMonth ? <span className="text-micro">{weekdayLabel(date)}</span> : null}
      <span className={`${reserveIconSpace ? "flex h-5 items-center " : ""}${disabled && !rangePart ? "text-sm leading-none" : "font-display text-figure font-bold leading-none"}`}>{date.getDate()}</span>
      {!disabled && icons ? (
        <span className={`flex items-center ${compactMonth ? "gap-0.5" : "gap-1"}`}>
          {icons.map(({ Icon, label, on }) => (
            <span key={label} className={on ? "text-ink" : "text-ink/20"}>
              <Icon size={compactMonth ? 10 : 12} aria-hidden />
              <span className="sr-only">{label}</span>
            </span>
          ))}
        </span>
      ) : reserveIconSpace && !details?.indicator ? <span aria-hidden className="h-3" /> : null}
      {details?.indicator ? (
        <span aria-hidden className="block w-full min-w-0 px-0.5">{details.indicator}</span>
      ) : null}
      {details ? <span id={descriptionId} className="sr-only">{details.label}</span> : null}
    </button>
  );
  return hasActions ? (
    <div className={`min-w-0 border ${appearance}`}>
      {button}
      <div className="text-ink">{details?.actions}</div>
    </div>
  ) : button;
}
