"use client";

import { SPACES, formatMoney, type DayType, type SpaceId } from "@/lib/event-pricing";
import { cn } from "@/lib/utils";
import { SpaceDetailsDialog } from "./space-details-dialog";

interface SpacePickerProps {
  selected: SpaceId | null;
  /** null until chosen: the cards then show the lowest price over both kinds of day. */
  day: DayType | null;
  guests: number;
  onSelect: (id: SpaceId) => void;
}

/** Venue cards with capacity and pricing. Details remain accessible regardless of capacity. */
export function SpacePicker({ selected, day, guests, onSelect }: SpacePickerProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      {SPACES.map((s) => {
        const days: DayType[] = day ? [day] : ["weekday", "weekend"];
        const rents = days.map((d) => s.rent(d, guests)).filter((r): r is number => r !== null);
        const rent = rents.length ? Math.min(...rents) : null;
        const min = s.minSpend(day ?? "weekend", guests);
        const tooSmall = guests > s.maxGuests;
        const active = !tooSmall && s.id === selected;
        const detailColor = active ? "text-dust/75" : tooSmall ? "" : "text-copy";
        const rentLabel = rent === null ? null : rent === 0 ? "Be nuomos mokesčio" : `${day ? "" : "nuo "}${formatMoney({ min: rent, max: rent })}`;
        const price = tooSmall
          ? `Iki ${s.maxGuests} asm.`
          : rent === null
            ? "Netaikoma"
            : rent > 0
              ? rentLabel
              : `Min. sąskaita ${min} €`;
        return (
          <div
            key={s.id}
            className={cn(
              "flex flex-col border transition-colors duration-150 ease-out-strong",
              active ? "border-ink bg-ink text-dust" : "border-line text-ink",
              !tooSmall && "hover:border-ink",
            )}
          >
            <button
              type="button"
              aria-pressed={s.id === selected}
              disabled={tooSmall}
              onClick={() => onSelect(s.id)}
              className="flex min-h-11 flex-1 flex-col gap-1.5 p-5 pb-2 text-left transition-transform duration-150 ease-out-strong motion-safe:active:scale-99 disabled:cursor-not-allowed disabled:text-ink/35"
            >
              <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="text-item font-bold">{s.label}</span>
                <span className="shrink-0 text-xs font-bold">{price}</span>
              </span>
              <span className={cn("text-xs leading-relaxed", detailColor)}>{s.blurb}</span>
              <span className={cn("text-xs", detailColor)}>
                Iki {s.maxGuests} asm. · {s.includedTime}
                {rent !== null && rent > 0 && min > 0 ? ` · min. sąskaita ${min} €` : ""}
              </span>
            </button>
            <div className="px-5 pb-2">
              <SpaceDetailsDialog space={s} rentLabel={rentLabel} minimumSpend={min} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
