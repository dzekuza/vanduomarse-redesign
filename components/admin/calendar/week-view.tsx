"use client";

import { DayMenu, type DayAction } from "./day-menu";
import { EntryCard } from "./entry-card";
import { entriesOn, weekDays, type CalendarEntry } from "@/lib/admin/calendar-entries";
import { formatDay } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

interface WeekViewProps {
  /** Any day of the week to show. */
  day: string;
  entries: readonly CalendarEntry[];
  today: string;
  onSelect: (day: string) => void;
  onOpen: (entry: CalendarEntry) => void;
  onCreate: (action: DayAction, day: string) => void;
}

/** Seven day columns from md up, one stacked list per day on phones; every entry is shown as a card. */
export function WeekView({ day, entries, today, onSelect, onOpen, onCreate }: WeekViewProps) {
  return (
    <div className="grid border-t border-l md:grid-cols-7">
      {weekDays(day).map((d) => {
        const list = entriesOn(entries, d);
        return (
          <DayMenu key={d} day={d} onSelect={onSelect} onCreate={onCreate}>
            <div className={cn("flex min-w-0 flex-col gap-2 border-r border-b p-2 md:min-h-64", d === day && "bg-accent")}>
              <button type="button" onClick={() => onSelect(d)} className={cn("min-h-11 text-left text-sm hover:text-rust", d === today ? "font-bold text-rust" : "font-medium")}>
                {formatDay(d)}
              </button>
              {list.length === 0 ? <p className="text-xs text-muted-foreground">Įrašų nėra</p> : null}
              {list.map((e) => (
                <EntryCard key={e.key} entry={e} onOpen={onOpen} />
              ))}
            </div>
          </DayMenu>
        );
      })}
    </div>
  );
}
