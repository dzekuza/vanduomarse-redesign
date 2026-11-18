"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface SectionTab {
  id: string;
  label: string;
}

/**
 * Sticky page tabs of a service page. The active tab moves toward the start of the row when it overflows.
 */
export function SectionTabs({ tabs, className }: { tabs: readonly SectionTab[]; className?: string }) {
  const [current, setCurrent] = useState<string | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sections = tabs.flatMap(({ id }) => document.getElementById(id) ?? []);
    if (sections.length === 0) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      // Match the resting position of a section after an anchor jump.
      const scrollPadding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const scrollMargin = parseFloat(getComputedStyle(sections[0]).scrollMarginTop) || 0;
      const readingLine = scrollPadding + scrollMargin + 2;
      const active = sections.findLast((section) => section.getBoundingClientRect().top <= readingLine);
      setCurrent(active?.id ?? null);
    };
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [tabs]);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;

    const active = strip.querySelector('[aria-current="location"]');
    const padding = parseFloat(getComputedStyle(strip).paddingLeft);
    const left = active
      ? strip.scrollLeft + active.getBoundingClientRect().left - strip.getBoundingClientRect().left - padding
      : 0;
    strip.scrollTo({
      left,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }, [current]);

  return (
    <nav aria-label="Puslapio skiltys" className={className}>
      <div ref={stripRef} className="scrollbar-ink flex gap-2 overflow-x-auto p-1">
        {tabs.map(({ id, label }) => (
          <Link
            prefetch={false}
            key={id}
            href={`#${id}`}
            aria-current={current === id ? "location" : undefined}
            className={cn(
              "inline-flex min-h-11 shrink-0 grow items-center justify-center whitespace-nowrap border border-line px-3 text-xs motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-out-strong hover:border-ink hover:bg-foam",
              current === id && "border-ink bg-foam font-bold",
            )}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
