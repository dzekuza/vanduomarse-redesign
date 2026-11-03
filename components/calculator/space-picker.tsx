"use client";

import { SPACES, type DayType, type SpaceId } from "@/lib/event-pricing";

interface SpacePickerProps {
  selected: SpaceId | null;
  /** null until chosen: the cards then show the lowest price over both kinds of day. */
  day: DayType | null;
  guests: number;
  onSelect: (id: SpaceId) => void;
}

/** Venue cards with capacity and price for the chosen day; too-small spaces are disabled. */
export function SpacePicker({ selected, day, guests, onSelect }: SpacePickerProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      {SPACES.map((s) => {
        const days: DayType[] = day ? [day] : ["weekday", "weekend"];
        const rents = days.map((d) => s.rent(d, guests)).filter((r): r is number => r !== null);
        const rent = rents.length ? Math.min(...rents) : null;
        const min = s.minSpend(day ?? "weekend", guests);
        const tooSmall = guests > s.maxGuests;
        const active = s.id === selected;
        const price = tooSmall
          ? `Iki ${s.maxGuests} asm.`
          : rent === null
            ? "Netaikoma"
            : rent > 0
              ? `${day ? "" : "nuo "}${rent.toLocaleString("lt-LT")} €`
              : `Min. sąskaita ${min} €`;
        return (
          <button
            key={s.id}
            type="button"
            aria-pressed={active}
            disabled={tooSmall}
            onClick={() => onSelect(s.id)}
            className={`flex flex-col gap-1.5 border p-5 text-left transition-[color,background-color,border-color,scale] duration-150 ease-out-strong motion-safe:active:scale-99 ${
              tooSmall
                ? "cursor-not-allowed border-line text-ink/35"
                : active
                  ? "border-ink bg-ink text-dust"
                  : "border-line text-ink hover:border-ink"
            }`}
          >
            <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="text-item font-bold">{s.label}</span>
              <span className="shrink-0 text-xs font-bold">{price}</span>
            </span>
            <span className={`text-xs leading-relaxed ${active ? "text-dust/75" : "text-ink/65"}`}>{s.blurb}</span>
            <span className={`text-xs ${active ? "text-dust/65" : "text-ink/55"}`}>
              Iki {s.maxGuests} asm. · {s.includedTime}
              {rent !== null && rent > 0 && min > 0 ? ` · min. sąskaita ${min} €` : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
