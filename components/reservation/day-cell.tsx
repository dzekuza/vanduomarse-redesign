"use client";

import type { DayIcon } from "@/components/booking/day-picker";
import { longDateLabel, weekdayLabel } from "@/lib/sauna";

interface DayCellProps {
  date: Date;
  active: boolean;
  isToday: boolean;
  /** Outside the days that can be booked (calendar view only). */
  disabled?: boolean;
  icons: DayIcon[];
  onSelect: (date: Date) => void;
  /** Fills its grid cell instead of the strip's fixed width. */
  fluid?: boolean;
}

/** One day: weekday, big number, a dot for today and the sauna / stay / quad availability marks. */
export function DayCell({ date, active, isToday, disabled, icons, onSelect, fluid }: DayCellProps) {
  const anyFree = icons.some((i) => i.on);
  return (
    <button
      type="button"
      onClick={() => onSelect(date)}
      disabled={disabled}
      aria-pressed={active}
      aria-label={longDateLabel(date)}
      className={`relative flex min-h-11 flex-col items-center gap-1 border py-2.5 text-sm transition-[color,background-color,border-color,scale] duration-150 ease-out-strong motion-safe:active:scale-97 sm:py-3 ${
        fluid ? "w-full" : "w-14 shrink-0 sm:w-16"
      } ${
        disabled
          ? "cursor-not-allowed border-transparent text-ink/25"
          : active
            ? "border-ink bg-ink text-dust"
            : anyFree
              ? "border-line text-ink hover:border-rust"
              : "border-line text-ink/45 hover:border-line"
      }`}
    >
      {isToday && !disabled ? <span aria-hidden className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-rust" /> : null}
      <span className="text-micro">{weekdayLabel(date)}</span>
      <span className={disabled ? "text-sm leading-none" : "font-display text-xl font-bold leading-none"}>{date.getDate()}</span>
      {disabled ? null : (
        <span className="flex items-center gap-1">
          {icons.map(({ Icon, label, on }) => (
            <span key={label} className={on ? (active ? "text-dust" : "text-ink") : active ? "text-dust/25" : "text-ink/20"}>
              <Icon size={12} aria-hidden />
              <span className="sr-only">{label}</span>
            </span>
          ))}
        </span>
      )}
    </button>
  );
}
