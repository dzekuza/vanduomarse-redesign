"use client";

import { BookingStatusBadge } from "../status-badge";
import { KindMark } from "./kind-dot";
import { CALENDAR_KINDS, seatsLabel, type CalendarEntry } from "@/lib/admin/calendar-entries";
import { formatDay } from "@/lib/admin/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DayAgendaProps {
  day: string;
  entries: readonly CalendarEntry[];
  onOpen: (entry: CalendarEntry) => void;
}

function Row({ entry, onOpen }: { entry: CalendarEntry; onOpen: (e: CalendarEntry) => void }) {
  const label = CALENDAR_KINDS.find((k) => k.id === entry.kind)?.label;
  return (
    <button type="button" onClick={() => onOpen(entry)} className="flex min-h-11 w-full items-start gap-3 py-3 text-left first:pt-0 hover:text-rust">
      <KindMark kind={entry.kind} className="mt-1" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {entry.time ? `${entry.time} · ` : ""}
          {entry.title}
          {entry.event || !entry.detail ? "" : ` · ${entry.detail}`}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {entry.event ? `${label} · ${entry.detail}` : `${label} · ${entry.customer.name} · ${entry.reference}`}
        </span>
      </span>
      {entry.event ? <Badge variant="outline">{seatsLabel(entry.event)}</Badge> : <BookingStatusBadge status={entry.status} />}
    </button>
  );
}

/** Everything happening on the selected day: events (with seats) and bookings. Not rendered for an empty day. */
export function DayAgenda({ day, entries, onOpen }: DayAgendaProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{formatDay(day)}</CardTitle>
        <CardDescription>Įrašų: {entries.length}</CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        {entries.map((e) => (
          <Row key={e.key} entry={e} onOpen={onOpen} />
        ))}
      </CardContent>
    </Card>
  );
}
