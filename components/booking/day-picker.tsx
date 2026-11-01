"use client";

import { dateKey, longDateLabel, weekdayLabel } from "@/lib/sauna";

/** Optional third line under the day number, e.g. free cabins. */
export interface DayNote {
  text: string;
  disabled?: boolean;
}

export function DayPicker({
  days,
  selected,
  onSelect,
  note,
}: {
  days: Date[];
  selected: Date;
  onSelect: (date: Date) => void;
  note?: (date: Date) => DayNote | undefined;
}) {
  return (
    <div className="scrollbar-ink flex gap-1.5 overflow-x-auto pb-3 sm:gap-2">
      {days.map((d) => {
        const key = dateKey(d);
        const active = key === dateKey(selected);
        const info = note?.(d);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(d)}
            disabled={info?.disabled}
            aria-pressed={active}
            className={`flex w-14 shrink-0 flex-col items-center gap-1 border py-2.5 text-sm sm:w-16 sm:py-3 transition-[color,background-color,border-color,scale] duration-150 ease-out-strong motion-safe:active:scale-97 ${
              info?.disabled
                ? "cursor-not-allowed border-ink/30 text-ink/30"
                : active
                  ? "border-ink bg-ink text-foam"
                  : "border-ink text-ink/70 hover:border-rust"
            }`}
          >
            <span className="text-xs">{weekdayLabel(d)}</span>
            <span className="font-display text-xl font-bold leading-none">{d.getDate()}</span>
            {info && <span className={`text-micro sm:text-xs ${active ? "text-foam/70" : ""}`}>{info.text}</span>}
          </button>
        );
      })}
      <span className="sr-only">{longDateLabel(selected)}</span>
    </div>
  );
}
