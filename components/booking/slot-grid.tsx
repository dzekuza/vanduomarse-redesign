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
            className={`flex flex-col items-center gap-0.5 border py-3 text-sm transition-[color,background-color,border-color,transform] active:scale-[0.97] ${
              !available
                ? "cursor-not-allowed border-ink/30 text-ink/30 line-through"
                : active
                  ? "border-ink bg-ink text-foam"
                  : "border-ink text-ink hover:border-rust"
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
