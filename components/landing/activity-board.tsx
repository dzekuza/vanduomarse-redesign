"use client";

import { useState } from "react";
import { FilterChip } from "@/components/events/filter-chip";
import { cn } from "@/lib/utils";
import { ACTIVITY_CARDS, FILTERS, type ActivityFilter } from "./content";
import { ActivityTile } from "./activity-tile";
import { Reveal } from "@/components/reveal";

/** The requested single-row category picker scrolls inside its own container. */
export function ActivityBoard() {
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const cards = ACTIVITY_CARDS.filter((c) => filter === "all" || c.categories.includes(filter));

  return (
    <>
      <div role="group" aria-label="Veiklų filtras" className="scrollbar-ink mb-6 flex gap-2 overflow-x-auto overscroll-x-contain py-3 md:mb-8 md:py-4">
        {FILTERS.map((f) => {
          const count = f.id === "all" ? ACTIVITY_CARDS.length : ACTIVITY_CARDS.filter((card) => card.categories.includes(f.id)).length;
          return (
            <FilterChip
              key={f.id}
              active={f.id === filter}
              count={count}
              onClick={() => setFilter(f.id)}
              className={cn("shrink-0 whitespace-nowrap", f.id !== filter && "border-ink/30")}
            >
              {f.label}
            </FilterChip>
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
