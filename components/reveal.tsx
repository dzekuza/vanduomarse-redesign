"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Fades and lifts its children in once, the first time they scroll into view.
 * Content already on screen at mount is left alone (no flash), and reduced
 * motion never hides anything. Add `delay-*` through `className` to stagger.
 */
export function Reveal({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const { top, bottom } = el.getBoundingClientRect();
    if (top < window.innerHeight * 0.9 && bottom > 0) {
      // On screen already (also when the effect re-runs after a hash jump, Strict Mode or Fast Refresh): never stay hidden.
      delete el.dataset.reveal;
      return;
    }

    el.dataset.reveal = "hidden";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.reveal = "shown";
        observer.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,translate] duration-700 ease-out-strong motion-reduce:transition-none data-[reveal=hidden]:translate-y-6 data-[reveal=hidden]:opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
