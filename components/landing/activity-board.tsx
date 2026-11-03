"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ACTIVITY_CARDS, FILTERS, type ActivityFilter } from "./content";
import { ActivityTile } from "./activity-tile";
import { Reveal } from "@/components/reveal";

/** Filter chips + the grid of activity cards. Chips wrap; they never scroll sideways. */
export function ActivityBoard() {
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const cards = ACTIVITY_CARDS.filter((c) => filter === "all" || c.categories.includes(filter));

  return (
    <>
      <div role="group" aria-label="Veiklų filtras" className="mb-6 flex flex-wrap gap-1.5 py-3 md:mb-8 md:gap-2.5 md:py-4">
        {FILTERS.map((f) => {
          const active = f.id === filter;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f.id)}
              className={cn(
                "min-h-11 border px-3 text-xs whitespace-nowrap transition-[color,background-color,border-color,scale] duration-150 ease-out-strong motion-safe:active:scale-97 md:px-4",
                active ? "border-ink bg-ink text-dust" : "border-transparent hover:border-ink",
              )}
            >
              {f.label}
              {f.count ? <span className="ml-2 text-micro">{f.count}</span> : null}
            </button>
          );
        })}
      </div>
      <div className="grid gap-x-6 gap-y-8 md:grid-cols-2 md:gap-y-10">
        {cards.map((card, i) => (
          <Reveal key={card.id} className={i % 2 ? "md:delay-100" : undefined}>
            <ActivityTile card={card} />
          </Reveal>
        ))}
      </div>
    </>
  );
}
