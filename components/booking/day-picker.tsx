"use client";

import type { ComponentType } from "react";
import { dateKey, longDateLabel, weekdayLabel } from "@/lib/sauna";

/** Optional third line under the day number, e.g. free cabins. */
export interface DayNote {
  text: string;
  disabled?: boolean;
}

/** A small status icon under the day number, e.g. "sauna free that day". */
export interface DayIcon {
  Icon: ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  /** Screen-reader text, e.g. "Pirtis laisva". */
  label: string;
  on: boolean;
}

export function DayPicker({
  days,
  selected,
  onSelect,
  note,
  icons,
}: {
  days: Date[];
  selected: Date;
  onSelect: (date: Date) => void;
  note?: (date: Date) => DayNote | undefined;
  icons?: (date: Date) => DayIcon[];
}) {
  return (
    <div className="scrollbar-ink flex gap-1.5 overflow-x-auto pb-3 sm:gap-2">
      {days.map((d) => {
        const key = dateKey(d);
        const active = key === dateKey(selected);
        const info = note?.(d);
        const marks = icons?.(d);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(d)}
            disabled={info?.disabled}
            aria-pressed={active}
            className={`relative flex min-w-14 shrink-0 flex-col items-center gap-1 border px-2 py-2.5 text-sm sm:min-w-16 sm:py-3 transition-[color,background-color,border-color,scale] duration-150 ease-out-strong motion-safe:active:scale-97 ${
              info?.disabled
                ? "cursor-not-allowed border-line text-ink/30"
                : active
                  ? "border-ink bg-ink text-foam"
                  : "border-ink text-ink/70 hover:border-rust"
            }`}
          >
            <span className="text-xs">{weekdayLabel(d)}</span>
            <span className="font-display text-figure font-bold leading-none">{d.getDate()}</span>
            {info && <span className={`text-micro sm:text-xs ${active ? "text-foam/70" : ""}`}>{info.text}</span>}
            {marks ? (
              <span className="flex items-center gap-1">
                {marks.map(({ Icon, label, on }) => (
                  <span key={label} className={on ? (active ? "text-foam" : "text-ink") : active ? "text-foam/25" : "text-ink/20"}>
                    <Icon size={12} aria-hidden />
                    <span className="sr-only">{label}</span>
                  </span>
                ))}
              </span>
            ) : null}
          </button>
        );
      })}
      <span className="sr-only">{longDateLabel(selected)}</span>
    </div>
  );
}
