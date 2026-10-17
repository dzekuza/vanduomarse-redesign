"use client";

import { dateKey, longDateLabel, weekdayLabel } from "@/lib/sauna";

export function DayPicker({
  days,
  selected,
  onSelect,
}: {
  days: Date[];
  selected: Date;
  onSelect: (date: Date) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {days.map((d) => {
        const key = dateKey(d);
        const active = key === dateKey(selected);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(d)}
            aria-pressed={active}
            className={`flex w-16 shrink-0 flex-col items-center gap-1 border py-3 text-sm transition-[color,background-color,border-color,transform] active:scale-[0.97] ${
              active ? "border-rust bg-rust text-foam" : "border-ink/15 text-ink/70 hover:border-ink/40"
            }`}
          >
            <span className="text-xs">{weekdayLabel(d)}</span>
            <span className="font-display text-xl font-bold leading-none">{d.getDate()}</span>
          </button>
        );
      })}
      <span className="sr-only">{longDateLabel(selected)}</span>
    </div>
  );
}
