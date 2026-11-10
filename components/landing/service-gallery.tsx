"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ServicePhoto } from "./content";

const ARROW =
  "grid size-11 place-items-center rounded-full bg-dust text-ink transition-[scale,background-color] duration-150 ease-out-strong hover:bg-rust hover:text-on-rust motion-safe:active:scale-95";

/**
 * Snap-scrolling activity photos with arrows, plus thumbnails on the service hero. `data-vaul-no-drag` keeps a sideways
 * swipe here from closing the drawer.
 */
export function ServiceGallery({ photos, variant = "default", label = "Veiklos nuotraukos", initialIndex = 0, wideHero = false }: {
  photos: ServicePhoto[];
  variant?: "default" | "panel" | "hero" | "lightbox";
  label?: string;
  initialIndex?: number;
  wideHero?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const thumbnails = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(initialIndex);
  const last = photos.length - 1;
  const hero = variant === "hero";

  useLayoutEffect(() => {
    if (initialIndex && track.current) track.current.scrollLeft = initialIndex * track.current.clientWidth;
  }, [initialIndex]);

  useLayoutEffect(() => {
    const rail = thumbnails.current;
    const thumbnail = rail?.children[index] as HTMLElement | undefined;
    if (!rail || !thumbnail) return;
    if (thumbnail.offsetTop < rail.scrollTop) rail.scrollTop = thumbnail.offsetTop;
    const bottom = thumbnail.offsetTop + thumbnail.offsetHeight;
    if (bottom > rail.scrollTop + rail.clientHeight) rail.scrollTop = bottom - rail.clientHeight;
  }, [index]);

  const goTo = (i: number) => {
    const el = track.current;
    if (!el || el.clientWidth === 0) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setIndex(i);
    el.scrollTo({ left: i * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  };

  const onScroll = () => {
    const el = track.current;
    if (el && el.clientWidth > 0) setIndex(Math.min(last, Math.round(el.scrollLeft / el.clientWidth)));
  };

  return (
    <div className={cn(hero && last > 0 && "lg:grid lg:grid-cols-8 lg:gap-3")}>
      {hero && last > 0 ? (
        <div className="relative hidden lg:block">
          <div ref={thumbnails} aria-label="Nuotraukų miniatiūros" role="group" className="scrollbar-ink absolute inset-0 grid auto-rows-min gap-2 overflow-y-auto">
            {photos.map((photo, i) => (
              <button
                key={photo.src}
                type="button"
                aria-label={`Nuotrauka ${i + 1}. ${photo.alt}`}
                aria-pressed={i === index}
                onClick={() => goTo(i)}
                className={cn("relative aspect-square min-h-11 overflow-hidden border-2 border-transparent opacity-75 transition-opacity hover:opacity-100 focus-visible:outline-offset-0 xl:aspect-4/3", i === index && "border-ink opacity-100")}
              >
                <Image src={photo.src} alt="" fill sizes="10vw" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div data-vaul-no-drag className={cn("relative", {
        "aspect-video max-h-48 w-full bg-dust-soft": variant === "panel",
        "h-44 md:h-60": variant === "default",
        "aspect-4/3 min-w-0 bg-dust-soft lg:col-span-7": hero,
        "h-72 bg-ink sm:h-100 lg:h-124": variant === "lightbox",
      }, hero && wideHero && "lg:aspect-2/1")}>
        <div
          ref={track}
          role="region"
          aria-label={label}
          tabIndex={photos.length > 1 ? 0 : undefined}
          onScroll={onScroll}
          onKeyDown={(event) => {
            if (photos.length < 2) return;
            const next = event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
              : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
                : event.key === "Home" ? 0 : event.key === "End" ? last : null;
            if (next === null) return;
            event.preventDefault();
            goTo(next);
          }}
          className="scrollbar-none flex h-full snap-x snap-mandatory overflow-x-auto"
        >
          {photos.map((photo, i) => (
            <div key={photo.src} className="relative h-full w-full shrink-0 snap-start">
              <Image src={photo.src} alt={photo.alt} fill quality={90} loading={i === initialIndex && variant !== "lightbox" ? "eager" : "lazy"} sizes={variant === "panel" ? "(min-width: 1024px) 33vw, 100vw" : hero ? "(min-width: 1024px) 58vw, 100vw" : "(min-width: 640px) 768px, 100vw"} className={variant === "lightbox" ? "object-contain" : "object-cover"} />
            </div>
          ))}
        </div>
        {photos.length > 1 ? (
          <>
            <p aria-live="polite" className="sr-only">
              {index + 1} / {photos.length}
            </p>
            {variant !== "default" ? <span aria-hidden className="absolute bottom-3 left-3 bg-ink/60 px-2 py-1 text-micro text-dust">{index + 1} / {photos.length}</span> : <div aria-hidden className="absolute bottom-5 left-6 flex gap-1.5 md:left-10">
              {photos.map((photo, i) => (
                <span key={photo.src} className={cn("h-1 w-6 transition-colors duration-200", i === index ? "bg-dust" : "bg-dust/40")} />
              ))}
            </div>}
            <div className={variant === "panel" ? "absolute right-3 bottom-3 flex gap-2" : "absolute right-4 bottom-3 flex gap-2 md:right-8"}>
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
    </div>
  );
}
