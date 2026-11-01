"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ServicePhoto } from "./content";

const ARROW =
  "grid size-11 place-items-center rounded-full bg-dust text-ink transition-[scale,background-color] duration-150 ease-out-strong hover:bg-rust motion-safe:active:scale-95";

/**
 * Snap-scrolling photo strip for the top of the activity drawer, with dots and
 * arrows when there is more than one photo. `data-vaul-no-drag` keeps a sideways
 * swipe here from closing the drawer.
 */
export function ServiceGallery({ photos }: { photos: ServicePhoto[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const last = photos.length - 1;

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: i * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  };

  const onScroll = () => {
    const el = track.current;
    if (el) setIndex(Math.min(last, Math.round(el.scrollLeft / el.clientWidth)));
  };

  return (
    <div data-vaul-no-drag className="relative h-44 md:h-60">
      <div
        ref={track}
        role="region"
        aria-label="Veiklos nuotraukos"
        tabIndex={photos.length > 1 ? 0 : undefined}
        onScroll={onScroll}
        className="scrollbar-none flex h-full snap-x snap-mandatory overflow-x-auto"
      >
        {photos.map((photo, i) => (
          <div key={photo.src} className="relative h-full w-full shrink-0 snap-start">
            <Image src={photo.src} alt={photo.alt} fill quality={90} priority={i === 0} sizes="(min-width: 640px) 672px, 100vw" className="object-cover" />
          </div>
        ))}
      </div>
      {photos.length > 1 ? (
        <>
          <p aria-live="polite" className="sr-only">
            {index + 1} / {photos.length}
          </p>
          <div aria-hidden className="absolute bottom-5 left-6 flex gap-1.5 md:left-10">
            {photos.map((photo, i) => (
              <span key={photo.src} className={cn("h-1 w-6 transition-colors duration-200", i === index ? "bg-dust" : "bg-dust/40")} />
            ))}
          </div>
          <div className="absolute right-4 bottom-3 flex gap-2 md:right-8">
            <button type="button" aria-label="Ankstesnė nuotrauka" onClick={() => goTo(index === 0 ? last : index - 1)} className={ARROW}>
              <ArrowLeftIcon aria-hidden size={20} />
            </button>
            <button type="button" aria-label="Kita nuotrauka" onClick={() => goTo(index === last ? 0 : index + 1)} className={ARROW}>
              <ArrowRightIcon aria-hidden size={20} />
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
