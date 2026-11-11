"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useRef, useState, type PointerEvent } from "react";
import { cn } from "@/lib/utils";
import { GALLERY_SLIDES } from "./content";

const CONTROL =
  "grid size-12 place-items-center rounded-full border border-line-on-ink text-dust transition-[color,background-color,border-color,scale] duration-150 ease-out-strong hover:border-rust hover:bg-rust hover:text-on-rust motion-safe:active:scale-95 max-md:size-11";

/** Snap-scrolling photo strip with prev/next buttons and a 0X / 04 counter. */
export function MomentsGallery() {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ id: number; x: number; left: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
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

  // Touch keeps native horizontal momentum and vertical page scrolling. Mouse
  // and pen also get swipe-like dragging in desktop/responsive previews.
  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || event.button !== 0 || !event.isPrimary) return;
    suppressClick.current = false;
    drag.current = { id: event.pointerId, x: event.clientX, left: event.currentTarget.scrollLeft, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };
  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (!active || active.id !== event.pointerId) return;
    const distance = active.x - event.clientX;
    if (!active.moved && Math.abs(distance) < 4) return;
    active.moved = true;
    event.preventDefault();
    event.currentTarget.scrollLeft = active.left + distance;
  };
  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (!active || active.id !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    const el = event.currentTarget;
    if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
    if (!active.moved || step() === 0) return;
    suppressClick.current = true;
    const distance = el.scrollLeft - active.left;
    const start = Math.round(active.left / step());
    let next = Math.round(el.scrollLeft / step());
    if (next === start && Math.abs(distance) >= Math.min(60, step() * 0.2)) next += Math.sign(distance);
    goTo(Math.max(0, Math.min(last, next)));
  };

  return (
    <>
      <div className="mt-12 mb-9 flex flex-col items-start gap-6 md:mt-12 md:flex-row md:items-end md:justify-between">
        <h2 id="moments-title" className="text-title font-bold tracking-tighter md:text-display">
          VAIZDAI
          <br />
          <span className="text-outline whitespace-nowrap">IŠ MARSO</span>
        </h2>
        <div className="flex w-full items-center justify-end gap-2.5 md:w-auto">
          <span aria-live="polite" className="mr-auto text-micro md:mr-3">
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
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onLostPointerCapture={finishDrag}
        onClickCapture={(event) => {
          if (!suppressClick.current) return;
          suppressClick.current = false;
          event.preventDefault();
          event.stopPropagation();
        }}
        className={cn("scrollbar-none flex touch-auto gap-3.5 overflow-x-auto overscroll-x-contain select-none md:gap-6", dragging ? "cursor-grabbing snap-none" : "cursor-grab snap-x snap-mandatory")}
      >
        {GALLERY_SLIDES.map((slide) => (
          <figure key={slide.src} className="min-w-0 shrink-0 basis-11/12 snap-start md:basis-5/6">
            <div className="relative h-92 md:h-112 lg:h-140">
              <Image src={slide.src} alt={slide.alt} fill quality={90} sizes="(min-width: 768px) 83vw, 92vw" draggable={false} className="object-cover" />
            </div>
            <figcaption className="pt-4.5 text-xs tracking-wider">
              {slide.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
