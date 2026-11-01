"use client";

import { longDateLabel, weekdayLabel } from "@/lib/sauna";
import type { SaunaEvent } from "@/lib/sauna-events";

interface EventListProps {
  events: SaunaEvent[];
  selected: string | null;
  onSelect: (key: string) => void;
}

/** Upcoming public sauna sessions as selectable rows; full sessions are disabled. */
export function EventList({ events, selected, onSelect }: EventListProps) {
  return (
    <div role="radiogroup" aria-label="Renginiai" className="grid gap-2">
      {events.map((ev) => {
        const full = ev.spotsLeft === 0;
        const active = selected === ev.key;
        return (
          <button
            key={ev.key}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={full}
            onClick={() => onSelect(ev.key)}
            className={`grid grid-cols-[4rem_1fr_auto] items-center gap-4 border px-4 py-4 text-left transition-[color,background-color,border-color,scale] duration-150 ease-out-strong motion-safe:active:scale-99 ${
              full
                ? "cursor-not-allowed border-ink/30 text-ink/40"
                : active
                  ? "border-ink bg-ink text-foam"
                  : "border-ink text-ink hover:border-rust"
            }`}
          >
            <span className="flex flex-col items-center">
              <span className="text-xs">{weekdayLabel(ev.date)}</span>
              <span className="font-display text-xl font-bold leading-none">{ev.date.getDate()}</span>
            </span>
            <span className="min-w-0">
              <span className="block font-medium">
                {ev.title} <span className={active ? "text-foam/60" : "text-ink/50"}>· {ev.host}</span>
              </span>
              <span className={`block text-sm ${active ? "text-foam/70" : "text-ink/60"}`}>
                {longDateLabel(ev.date)}, {ev.time}
                {ev.minutes ? ` · ${ev.minutes} min` : ""}
              </span>
              <span className={`mt-1 block text-xs ${full ? "" : active ? "text-foam/70" : "text-rust"}`}>
                {full ? "Vietų nebeliko" : `Liko vietų: ${ev.spotsLeft}`}
              </span>
            </span>
            <span className="text-right">
              <span className="font-display block text-xl font-bold">{ev.pricePerPerson} €</span>
              <span className={`block text-xs ${active ? "text-foam/60" : "text-ink/50"}`}>asm.</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
