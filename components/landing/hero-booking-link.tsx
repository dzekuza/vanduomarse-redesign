"use client";

import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function HeroBookingLink() {
  const [floating, setFloating] = useState(false);
  const sticker = useRef<HTMLDivElement>(null);
  const progressRing = useRef<SVGCircleElement>(null);
  const previousRect = useRef<DOMRect | null>(null);
  const animation = useRef<Animation | null>(null);

  useEffect(() => {
    let pinned = false;

    const update = () => {
      const { scrollHeight, clientHeight } = document.documentElement;
      const scrollable = scrollHeight - clientHeight;
      // Round to the nearest pixel so fractional scroll positions can reach 100%.
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, Math.round(window.scrollY) / scrollable)) : 0;
      progressRing.current?.setAttribute("stroke-dashoffset", String(1 - progress));

      const nextPinned = window.scrollY >= 96;
      if (pinned === nextPinned) return;
      previousRect.current = sticker.current?.getBoundingClientRect() ?? null;
      pinned = nextPinned;
      setFloating(pinned);
    };
    const initialFrame = window.requestAnimationFrame(update);
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(document.body);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.cancelAnimationFrame(initialFrame);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      animation.current?.cancel();
    };
  }, []);

  useLayoutEffect(() => {
    const element = sticker.current;
    const from = previousRect.current;
    previousRect.current = null;
    animation.current?.cancel();
    if (!element || !from || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Move the wrapper between positions while the link scales from its bottom-right corner.
    const to = element.getBoundingClientRect();
    animation.current = element.animate(
      [
        { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px)` },
        { transform: "none" },
      ],
      { duration: 260, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
  }, [floating]);

  return (
    <div
      ref={sticker}
      className={cn(
        "pointer-events-none z-10 size-28 origin-top-left min-[375px]:max-md:size-34 lg:size-46",
        floating ? "fixed right-6 bottom-6" : "absolute right-gutter -bottom-12 md:bottom-28",
      )}
    >
      <Link
        href="/rezervacija"
        aria-label="Rezervuok laiką Marse"
        className={cn(
          "group/sticker @container pointer-events-auto relative grid size-full origin-bottom-right place-items-center rounded-full bg-rust text-center font-bold text-ink ring-5 ring-rust motion-safe:transition-transform motion-safe:duration-250 motion-safe:ease-out-strong",
          floating ? "scale-80 motion-safe:active:scale-75" : "motion-safe:active:scale-95",
        )}
      >
        <svg aria-hidden="true" viewBox="0 0 100 100" fill="none" className="pointer-events-none absolute inset-0 size-full -rotate-90">
          <circle cx="50" cy="50" r="49" className="stroke-ink/30" />
          <circle ref={progressRing} cx="50" cy="50" r="49" pathLength="1" strokeDasharray="1" strokeDashoffset="1" strokeWidth="2" className="stroke-ink" />
        </svg>
        <span className="grid rotate-12 justify-items-center gap-hero-sticker-gap whitespace-nowrap text-hero-sticker motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out-strong motion-safe:group-hover/sticker:rotate-0">
          <span>
            REZERVUOK
            <br />
            LAIKĄ MARSE
          </span>
          <ArrowUpRightIcon aria-hidden weight="light" className="size-hero-sticker-arrow" />
        </span>
      </Link>
    </div>
  );
}
