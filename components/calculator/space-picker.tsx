"use client";

import { SPACES, type DayType, type SpaceId } from "@/lib/event-pricing";

interface SpacePickerProps {
  selected: SpaceId;
  day: DayType;
  guests: number;
  onSelect: (id: SpaceId) => void;
}

/** Venue cards with capacity and price for the chosen day; too-small spaces are disabled. */
export function SpacePicker({ selected, day, guests, onSelect }: SpacePickerProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      {SPACES.map((s) => {
        const rent = s.rent(day, guests);
        const min = s.minSpend(day, guests);
        const tooSmall = guests > s.maxGuests;
        const active = s.id === selected;
        const price = tooSmall
          ? `Iki ${s.maxGuests} asm.`
          : rent === null
            ? "Netaikoma"
            : rent > 0
              ? `${rent.toLocaleString("lt-LT")} €`
              : `Min. sąskaita ${min} €`;
        return (
          <button
            key={s.id}
            type="button"
            aria-pressed={active}
            disabled={tooSmall}
            onClick={() => onSelect(s.id)}
            className={`flex flex-col gap-1 border px-4 py-4 text-left transition-[color,background-color,border-color,transform] active:scale-[0.99] ${
              tooSmall
                ? "cursor-not-allowed border-ink/30 text-ink/40"
                : active
                  ? "border-ink bg-ink text-foam"
                  : "border-ink text-ink hover:border-rust"
            }`}
          >
            <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="font-medium">{s.label}</span>
              <span className="font-display shrink-0 text-sm font-bold">{price}</span>
            </span>
            <span className={`text-xs ${active ? "text-foam/70" : "text-ink/60"}`}>{s.blurb}</span>
            <span className={`text-xs ${active ? "text-foam/60" : "text-ink/50"}`}>
              Iki {s.maxGuests} asm. · {s.includedTime}
              {rent !== null && rent > 0 && min > 0 ? ` · min. sąskaita ${min} €` : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
