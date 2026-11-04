"use client";

import { ArrowUpRightIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { SERVICES, type ActivityCard } from "./content";
import { useLanding } from "./landing-provider";

/** Cards that book on `/rezervacija` (opening that activity's tab); the rest open their details dialog. */
const RESERVE_HREF: Partial<Record<ActivityCard["id"], string>> = {
  sauna: "/rezervacija?veikla=pirtis",
  ciongo: "/rezervacija?veikla=keturraciai",
  cabins: "/rezervacija?veikla=nakvyne",
};

const TILE_CLASS = "group block w-full min-w-0 text-left transition-[scale] duration-150 ease-out-strong motion-safe:active:scale-99";

/** One activity card; bookable ones go to the reservation page, the others open their details dialog. */
export function ActivityTile({ card }: { card: ActivityCard }) {
  const { openService } = useLanding();
  const service = SERVICES[card.id];

  const href = RESERVE_HREF[card.id];
  const content = (
    <>
      <span className="relative block h-88 overflow-hidden bg-lake-soft md:h-80 lg:h-96">
        <Image
          src={service.photo}
          alt={card.alt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out-strong motion-safe:group-hover:scale-105"
        />
        <span className="absolute top-3.5 right-3.5 bg-dust px-2.5 py-2 text-micro text-ink md:top-5 md:right-5">
          {card.tag}
        </span>
        <span aria-hidden className="absolute right-4 bottom-4 grid size-12 place-items-center bg-dust text-ink transition-[background-color,rotate] duration-200 ease-out-strong group-hover:bg-rust motion-safe:group-hover:rotate-45">
          <ArrowUpRightIcon size={28} weight="light" />
        </span>
      </span>
      <span className="flex items-end justify-between gap-5 border-b border-line py-4 md:py-5">
        <span>
          <span className="block text-micro">{card.num}</span>
          <span className="mt-2 block text-heading font-bold tracking-tighter md:text-tile">{card.title}</span>
        </span>
        <span className="shrink-0 text-right text-xs leading-snug text-copy">
          {card.note[0]}
          <br />
          {card.note[1]}
        </span>
      </span>
    </>
  );

  return href ? (
    <Link href={href} className={TILE_CLASS}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={() => openService(card.id)} className={TILE_CLASS}>
      {content}
    </button>
  );
}
