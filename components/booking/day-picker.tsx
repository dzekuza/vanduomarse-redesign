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
    <div className="scrollbar-ink flex gap-2 overflow-x-auto pb-3">
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
            className={`flex w-16 shrink-0 flex-col items-center gap-1 border py-3 text-sm transition-[color,background-color,border-color,transform] active:scale-[0.97] ${
              info?.disabled
                ? "cursor-not-allowed border-ink/30 text-ink/30"
                : active
                  ? "border-ink bg-ink text-foam"
                  : "border-ink text-ink/70 hover:border-rust"
            }`}
          >
            <span className="text-xs">{weekdayLabel(d)}</span>
            <span className="font-display text-xl font-bold leading-none">{d.getDate()}</span>
            {info && <span className={`text-xs ${active ? "text-foam/70" : ""}`}>{info.text}</span>}
          </button>
        );
      })}
      <span className="sr-only">{longDateLabel(selected)}</span>
    </div>
  );
}
