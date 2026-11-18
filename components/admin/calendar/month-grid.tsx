"use client";

import { DayMenu, type DayAction } from "./day-menu";
import { EntryCard } from "./entry-card";
import { KindDot } from "./kind-dot";
import { entriesOn, monthGrid, type CalendarEntry } from "@/lib/admin/calendar-entries";
import { parseDay } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Pr", "An", "Tr", "Kt", "Pn", "Št", "Sk"];
const MAX_CARDS = 3;

interface MonthGridProps {
  month: Date;
  entries: readonly CalendarEntry[];
  selected: string;
  today: string;
  onSelect: (day: string) => void;
  onOpen: (entry: CalendarEntry) => void;
  onCreate: (action: DayAction, day: string) => void;
}

/**
 * Monday-first month. From md up each day lists its events and bookings as cards
 * (events show seats taken); on phones a day is a tappable dot summary and the
 * agenda below carries the detail. An empty day opens "Nauja rezervacija" for that
 * date on a plain click, since there is nothing to select; a day with entries still
 * selects it (the phone agenda, or just to re-view it). Right-click (long-press on
 * touch) a day for the same quick actions as the sauna calendar: new booking, session
 * or event, on any day.
 */
export function MonthGrid({ month, entries, selected, today, onSelect, onOpen, onCreate }: MonthGridProps) {
  return (
    <div className="grid grid-cols-7 border-t border-l">
      {WEEKDAYS.map((w) => (
        <p key={w} className="border-r border-b bg-muted px-1 py-2 text-center text-xs font-medium text-muted-foreground">
          {w}
        </p>
      ))}
      {monthGrid(month).map(({ day, inMonth }) => {
        const list = entriesOn(entries, day);
        const kinds = [...new Set(list.map((e) => e.kind))].slice(0, 4);
        return (
          <DayMenu key={day} day={day} onSelect={onSelect} onCreate={onCreate}>
            <div className={cn("flex min-w-0 flex-col border-r border-b md:min-h-40", !inMonth && "bg-muted/40 text-muted-foreground", day === selected && "bg-accent")}>
              <button
                type="button"
                onClick={() => (list.length === 0 ? onCreate("booking", day) : onSelect(day))}
                aria-pressed={list.length === 0 ? undefined : day === selected}
                aria-label={list.length === 0 ? `${day}: nauja rezervacija` : `${day}: ${list.length} įrašų`}
                className={cn("flex min-h-16 w-full flex-col items-start gap-1.5 p-1.5 text-left hover:bg-muted md:min-h-11 md:flex-row md:items-center md:justify-between md:p-2", day === selected && "ring-2 ring-ink ring-inset")}
              >
                <span className={cn("text-sm tabular-nums", day === today ? "font-bold text-rust" : "font-medium")}>{parseDay(day).getDate()}</span>
                {list.length ? (
                  <span className="flex flex-wrap items-center gap-1 md:hidden">
                    {kinds.map((k) => (
                      <KindDot key={k} kind={k} />
                    ))}
                    <span className="text-xs font-medium tabular-nums">{list.length}</span>
                  </span>
                ) : null}
              </button>
              <div className="hidden min-w-0 flex-col gap-1 p-1.5 pt-0 md:flex">
                {list.slice(0, MAX_CARDS).map((e) => (
                  <EntryCard key={e.key} entry={e} onOpen={onOpen} />
                ))}
                {list.length > MAX_CARDS ? (
                  <button type="button" onClick={() => onSelect(day)} className="min-h-11 text-left text-xs font-medium underline underline-offset-4 hover:text-rust">
                    +{list.length - MAX_CARDS} daugiau
                  </button>
                ) : null}
              </div>
            </div>
          </DayMenu>
        );
      })}
    </div>
  );
}
