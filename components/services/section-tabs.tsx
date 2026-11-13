"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface SectionTab {
  id: string;
  label: string;
}

/** Px from the viewport top: fixed header (106) + tabs (~60) + a little. Sections scroll to ~208 (`scroll-mt-52`). */
const READING_LINE = 240;

/**
 * Sticky page tabs of a service page. The tab of the section being read gets `aria-current` and the filled style
 * (a colour change only, no sliding indicator); clicking a tab jumps to its section like a plain anchor.
 */
export function SectionTabs({ tabs, className }: { tabs: readonly SectionTab[]; className?: string }) {
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const sections = tabs.flatMap(({ id }) => document.getElementById(id) ?? []);
    if (sections.length === 0) return;
    // The section being read is the last one whose top has passed the line just under the fixed header and these tabs.
    let frame = 0;
    const update = () => {
      frame = 0;
      const passed = sections.filter((section) => section.getBoundingClientRect().top <= READING_LINE);
      setCurrent(passed.length > 0 ? passed[passed.length - 1].id : null);
    };
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [tabs]);

  return (
    <nav aria-label="Puslapio skiltys" className={className}>
      {tabs.map(({ id, label }) => (
        <Link
          key={id}
          href={`#${id}`}
          aria-current={current === id ? "true" : undefined}
          className={cn(
            "inline-flex min-h-11 flex-1 items-center justify-center border border-line px-3 text-xs motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-out-strong hover:border-ink hover:bg-foam",
            current === id && "border-ink bg-foam font-bold",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
