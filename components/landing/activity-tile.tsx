"use client";

import { ArrowUpRightIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SERVICES, type ActivityCard } from "./content";
import { useLanding } from "./landing-provider";

const CORNER = {
  cabins: "rounded-tl-cut md:rounded-tl-cut-lg",
  party: "rounded-br-cut md:rounded-br-cut-lg",
} as const;

/** One activity card; opens its details dialog. */
export function ActivityTile({ card }: { card: ActivityCard }) {
  const { openService } = useLanding();
  const service = SERVICES[card.id];

  return (
    <button type="button" onClick={() => openService(card.id)} className="group block w-full min-w-0 text-left transition-[scale] duration-150 ease-out-strong motion-safe:active:scale-99">
      <span className={cn("relative block h-88 overflow-hidden bg-lake-soft md:h-80 lg:h-96", card.corner && CORNER[card.corner])}>
        <Image
          src={service.photo}
          alt={card.alt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out-strong motion-safe:group-hover:scale-105"
        />
        {/* text-micro (custom size) and text-ink are kept out of cn(): its merger mistakes the size for a colour and drops one. */}
        <span className={`${cn("absolute top-3.5 right-3.5 px-2.5 py-2 md:top-5 md:right-5", card.id === "ciongo" ? "bg-rust" : "bg-dust")} text-micro text-ink`}>
          {card.tag}
        </span>
        <span aria-hidden className="absolute right-4 bottom-4 grid size-12 place-items-center bg-dust text-ink transition-[background-color,rotate] duration-200 ease-out-strong group-hover:bg-rust motion-safe:group-hover:rotate-45">
          <ArrowUpRightIcon size={28} weight="light" />
        </span>
      </span>
      <span className="flex items-end justify-between gap-5 border-b border-line py-4 md:py-5">
        <span>
          <span className="block text-micro">{card.num}</span>
          <span className="mt-2 block text-2xl font-bold tracking-tighter md:text-tile">{card.title}</span>
        </span>
        <span className="shrink-0 text-right text-xs leading-snug">
          {card.note[0]}
          <br />
          {card.note[1]}
        </span>
      </span>
    </button>
  );
}
