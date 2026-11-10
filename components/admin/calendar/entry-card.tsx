"use client";

import { KIND_CARD, KindMark } from "./kind-dot";
import { seatsLabel, type CalendarEntry } from "@/lib/admin/calendar-entries";
import { cn } from "@/lib/utils";

/** Status dot for a booking, seat dot for an event: green while it has room or is confirmed, red when it needs staff or is full. */
function stateDot(entry: CalendarEntry): string {
  if (entry.event) return entry.event.capacity && entry.event.sold >= entry.event.capacity ? "bg-status-pending" : "bg-status-confirmed";
  return entry.status === "laukia" ? "bg-status-pending" : "bg-status-confirmed";
}

/** One event or booking inside a day cell: time, title and seats (events) or customer (bookings). */
export function EntryCard({ entry, onOpen }: { entry: CalendarEntry; onOpen: (entry: CalendarEntry) => void }) {
  const hidden = entry.event && !entry.event.published;
  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      className={cn("flex min-h-11 w-full flex-col gap-0.5 border border-l-4 px-2 py-1.5 text-left transition-[filter] hover:brightness-95", KIND_CARD[entry.kind], hidden && "border-dashed text-muted-foreground")}
    >
      <span className="flex items-center justify-between gap-1 text-xs text-muted-foreground">
        <span className="tabular-nums">{entry.time || "Visą dieną"}</span>
        <KindMark kind={entry.kind} />
      </span>
      <span className="line-clamp-2 text-xs leading-snug font-bold">{entry.title}</span>
      <span className="flex items-center gap-1.5 text-xs font-medium tabular-nums">
        <span aria-hidden className={cn("size-2 shrink-0 rounded-full", stateDot(entry))} />
        {entry.event ? seatsLabel(entry.event) : <span className="truncate font-normal text-muted-foreground">{entry.customer.name}</span>}
      </span>
    </button>
  );
}
