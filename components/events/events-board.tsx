"use client";

import { useMemo, useState } from "react";
import { EventRow } from "./event-row";
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
        {filters.map((f) => {
          const active = f.id === filter;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f.id)}
              className={`flex min-h-11 items-center gap-2 border border-ink px-4 text-sm uppercase transition-[color,background-color,transform] active:scale-[0.97] ${
                active ? "bg-ink text-foam" : "text-ink hover:bg-dust-soft"
              }`}
            >
              {f.label}
              <span className={`tabular-nums ${active ? "text-foam/60" : "text-ink/50"}`}>{f.count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 space-y-12">
        {groupByMonth(visible).map((group) => (
          <section key={group.heading} aria-label={group.heading}>
            <h2 className="font-display pb-4 text-2xl font-bold">{group.heading}</h2>
            <div className="grid gap-3">
              {group.events.map((ev) => (
                <EventRow key={ev.key} event={ev} />
              ))}
            </div>
          </section>
        ))}
        {visible.length === 0 ? <p className="text-ink/60">Šiuo metu renginių šioje kategorijoje nėra.</p> : null}
      </div>
    </div>
  );
}
