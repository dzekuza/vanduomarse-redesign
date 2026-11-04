"use client";

import { useMemo, useState } from "react";
import { EventRow } from "./event-row";
import { FilterChip } from "./filter-chip";
import { EVENT_CATEGORIES, monthHeading, toParkEvent, type EventCategory, type ParkEvent, type ParkEventData } from "@/lib/park-events";

type Filter = EventCategory | "visi";

function groupByMonth(events: ParkEvent[]): { heading: string; events: ParkEvent[] }[] {
  const groups: { heading: string; events: ParkEvent[] }[] = [];
  for (const ev of events) {
    const heading = monthHeading(ev.date);
    const last = groups.at(-1);
    if (last?.heading === heading) last.events.push(ev);
    else groups.push({ heading, events: [ev] });
  }
  return groups;
}

/** Filterable feed of upcoming park and sauna events, grouped by month. */
export function EventsBoard({ data }: { data: ParkEventData[] }) {
  const events = useMemo(() => data.map(toParkEvent), [data]);
  const [filter, setFilter] = useState<Filter>("visi");

  const visible = filter === "visi" ? events : events.filter((e) => e.category === filter);
  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "visi", label: "Visi", count: events.length },
    ...EVENT_CATEGORIES.map((c) => ({ id: c.id, label: c.label, count: events.filter((e) => e.category === c.id).length })),
  ];

  return (
    <div>
      <div role="group" aria-label="Renginių kategorijos" className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <FilterChip key={f.id} active={f.id === filter} count={f.count} onClick={() => setFilter(f.id)}>
            {f.label}
          </FilterChip>
        ))}
      </div>

      <div className="mt-8 space-y-10">
        {groupByMonth(visible).map((group) => (
          <section key={group.heading} aria-label={group.heading}>
            <h2 className="pb-4 text-tile font-bold">{group.heading}</h2>
            <div className="grid gap-4">
              {group.events.map((ev) => (
                <EventRow key={ev.key} event={ev} />
              ))}
            </div>
          </section>
        ))}
        {visible.length === 0 ? <p className="text-sm text-copy">Šiuo metu renginių šioje kategorijoje nėra.</p> : null}
      </div>
    </div>
  );
}
