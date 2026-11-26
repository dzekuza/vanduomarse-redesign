"use client";

import Image from "next/image";
import { formatMoney, type DayType, type Space } from "@/lib/event-pricing";
import { cn } from "@/lib/utils";
import { SpaceDetailsDialog } from "./space-details-dialog";
import { SPACE_PHOTOS } from "./space-photos";

interface VenueCardProps {
  /** Card title; the venue's, not the variant's. */
  label: string;
  /** The priced space shown on the card (the chosen variant, else the first one). */
  space: Space;
  /** null until the date is chosen: the card then shows the lowest price over both kinds of day. */
  day: DayType | null;
  guests: number;
  selected: boolean;
  /** A camp: spaces with a camp rate show it per day. */
  camp?: boolean;
  onToggle: () => void;
  className?: string;
}

/** One selectable venue: thumbnail (opens the gallery), name, price from the sheet, capacity. Cards toggle, so several can be picked. */
export function VenueCard({ label, space, day, guests, selected, camp, onToggle, className }: VenueCardProps) {
  const days: DayType[] = day ? [day] : ["weekday", "weekend"];
  const rents = days.map((d) => space.rent(d, guests)).filter((r): r is number => r !== null);
  const rent = rents.length ? Math.min(...rents) : null;
  const min = space.minSpend(day ?? "weekend", guests);
  const tooSmall = guests > space.maxGuests;
  const active = !tooSmall && selected;
  const detailColor = active ? "text-dust/75" : tooSmall ? "" : "text-copy";
  const campRate = camp && space.campRent !== undefined;
  const rentLabel = campRate ? `${space.campRent} € / d.` : rent === null ? null : rent === 0 ? "Be nuomos mokesčio" : `${day ? "" : "nuo "}${formatMoney({ min: rent, max: rent })}`;
  const price = tooSmall ? `Iki ${space.maxGuests} asm.` : campRate ? rentLabel : rent === null ? "Netaikoma" : space.cardFrom ? `nuo ${formatMoney({ min: space.cardFrom, max: space.cardFrom })}` : rent > 0 ? rentLabel : `${day ? "" : "nuo "}${formatMoney({ min, max: min })}`;
  const photo = SPACE_PHOTOS[space.id][0];

  return (
    <div
      className={cn(
        "flex border transition-colors duration-150 ease-out-strong",
        active ? "border-ink bg-ink text-dust" : "border-line text-ink",
        !tooSmall && "hover:border-ink",
        className,
      )}
    >
      <SpaceDetailsDialog
        space={space}
        rentLabel={rentLabel}
        minimumSpend={min}
        className="relative block size-24 shrink-0 self-start overflow-hidden bg-ink/10 transition-opacity hover:opacity-80 sm:size-28"
      >
        <Image src={photo.src} alt="" fill sizes="7rem" className={cn("object-cover", tooSmall && "opacity-35")} />
      </SpaceDetailsDialog>
      <button
        type="button"
        aria-pressed={selected}
        disabled={tooSmall}
        onClick={onToggle}
        className="flex min-h-11 flex-1 text-left transition-transform duration-150 ease-out-strong motion-safe:active:scale-99 disabled:cursor-not-allowed disabled:text-ink/35"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1 p-3">
          <span className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="text-xs font-bold sm:text-sm">{label}</span>
            <span className="shrink-0 text-xs font-bold">{price}</span>
          </span>
          <span className={cn("line-clamp-2 text-xs leading-snug", detailColor)}>{space.blurb}</span>
          <span className={cn("text-xs", detailColor)}>
            Iki {space.maxGuests} asm. · {space.includedTime}
            {rent !== null && min > 0 ? ` · min. sąskaita ${min} €` : ""}
          </span>
          {space.note ? <span className={cn("text-xs", detailColor)}>{space.note}</span> : null}
        </span>
      </button>
    </div>
  );
}
