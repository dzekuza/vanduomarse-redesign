"use client";

import { DayMenu, type DayAction } from "./day-menu";
import { EntryCard } from "./entry-card";
import type { CalendarEntry } from "@/lib/admin/calendar-entries";

interface DayViewProps {
  day: string;
  entries: readonly CalendarEntry[];
  onSelect: (day: string) => void;
  onOpen: (entry: CalendarEntry) => void;
  onCreate: (action: DayAction, day: string) => void;
}

/** One day: every event and booking as a card, in a responsive grid. */
export function DayView({ day, entries, onSelect, onOpen, onCreate }: DayViewProps) {
  return (
    <DayMenu day={day} onSelect={onSelect} onCreate={onCreate}>
      <div className="grid min-h-64 content-start gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {entries.length === 0 ? <p className="text-sm text-muted-foreground sm:col-span-full">Šią dieną įrašų nėra. Dešiniu pelės mygtuku pridėkite naują.</p> : null}
        {entries.map((e) => (
          <EntryCard key={e.key} entry={e} onOpen={onOpen} />
        ))}
      </div>
    </DayMenu>
  );
}
