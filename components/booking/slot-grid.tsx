"use client";

import { SLOT_TIMES, isSlotAvailable, slotPrice, type SlotTime } from "@/lib/sauna";

export function SlotGrid({
  date,
  dateK,
  selected,
  onSelect,
}: {
  date: Date;
  dateK: string;
  selected: SlotTime | null;
  onSelect: (time: SlotTime) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {SLOT_TIMES.map((time) => {
        const available = isSlotAvailable(dateK, time);
        const active = selected === time;
        return (
          <button
            key={time}
            type="button"
            disabled={!available}
            onClick={() => onSelect(time)}
            aria-pressed={active}
            className={`flex flex-col items-center gap-0.5 border py-3 text-sm transition-colors ${
              !available
                ? "cursor-not-allowed border-ink/10 text-ink/30 line-through"
                : active
                  ? "border-rust bg-rust text-foam"
                  : "border-ink/15 text-ink hover:border-ink/40"
            }`}
          >
            <span className="font-medium">{time}</span>
            <span className={active ? "text-foam/70" : "text-ink/50"}>{slotPrice(date, time)} €</span>
          </button>
        );
      })}
    </div>
  );
}
