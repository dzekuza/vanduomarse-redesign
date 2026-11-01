"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useRef, useState } from "react";
import { GALLERY_SLIDES } from "./content";

const CONTROL =
  "grid size-12 place-items-center rounded-full border border-dust/50 text-dust transition-[color,background-color,border-color,scale] duration-150 ease-out-strong hover:border-rust hover:bg-rust hover:text-ink motion-safe:active:scale-95 max-md:size-11";

/** Snap-scrolling photo strip with prev/next buttons and a 0X / 04 counter. */
export function MomentsGallery() {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const last = GALLERY_SLIDES.length - 1;

  /** Distance between the left edges of two neighbouring slides. */
  const step = () => {
    const slides = track.current?.children;
    return slides && slides.length > 1 ? (slides[1] as HTMLElement).offsetLeft - (slides[0] as HTMLElement).offsetLeft : 0;
  };

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: i * step(), behavior: reduce ? "auto" : "smooth" });
  };

  const onScroll = () => {
    const el = track.current;
    if (!el || !step()) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
    setIndex(atEnd ? last : Math.min(last, Math.round(el.scrollLeft / step())));
  };

  return (
    <>
      <div className="mt-12 mb-9 flex items-end justify-between gap-6 md:mt-12">
        <h2 id="moments-title" className="text-4xl font-bold tracking-tighter md:text-display">
          ČIA GERIAU
          <br />
          <span className="text-outline">GYVAI.</span>
        </h2>
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <span aria-live="polite" className="mr-3 text-micro max-md:w-full max-md:text-right">
            {`0${index + 1} / 0${GALLERY_SLIDES.length}`}
          </span>
          <button type="button" aria-label="Ankstesnė nuotrauka" onClick={() => goTo(index === 0 ? last : index - 1)} className={CONTROL}>
            <ArrowLeftIcon aria-hidden size={22} />
          </button>
          <button type="button" aria-label="Kita nuotrauka" onClick={() => goTo(index === last ? 0 : index + 1)} className={CONTROL}>
            <ArrowRightIcon aria-hidden size={22} />
          </button>
        </div>
      </div>
      <div
        ref={track}
        role="region"
        aria-label="Marso nuotraukų galerija"
        tabIndex={0}
        onScroll={onScroll}
        className="scrollbar-none flex snap-x snap-mandatory gap-3.5 overflow-x-auto md:gap-6"
      >
        {GALLERY_SLIDES.map((slide, i) => (
          <figure key={slide.src} className="min-w-0 shrink-0 basis-11/12 snap-start md:basis-5/6">
            <div className="relative h-92 md:h-112 lg:h-140">
              <Image src={slide.src} alt={slide.alt} fill quality={90} sizes="(min-width: 768px) 83vw, 92vw" priority={i === 0} className="object-cover" />
            </div>
            <figcaption className="flex justify-between gap-2.5 pt-4.5 text-xs tracking-wider">
              <span>{slide.left}</span>
              <span>{slide.right}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
