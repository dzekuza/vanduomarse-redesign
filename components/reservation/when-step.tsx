"use client";

import { CalendarBlankIcon } from "@phosphor-icons/react";
import { useId, useState } from "react";
import type { DayIcon } from "@/components/booking/day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MAX_STAY_NIGHTS } from "@/lib/cabin";
import { DatePicker } from "./date-picker";

export type StayDatePhase = "idle" | "selectingEnd" | "complete";

interface WhenStepProps {
  days: Date[];
  date: Date;
  onDate: (date: Date) => void;
  compact?: boolean;
  /** Availability icons under each day. */
  icons: (date: Date) => DayIcon[];
  stay?: {
    phase: StayDatePhase;
    end: Date | null;
    lastEnd: Date;
    onSelect: (date: Date) => void;
  };
}

const STAY_DATE_LABEL = new Intl.DateTimeFormat("lt-LT", { day: "numeric", month: "long" });

/** Select the activity day or the arrival and departure of a stay. */
export function WhenStep({ days, date, onDate, icons, stay, compact }: WhenStepProps) {
  const dateId = useId();
  const [open, setOpen] = useState(false);
  const selected = stay?.phase === "idle" ? null : date;
  const select = stay?.onSelect ?? onDate;
  const stayLabel = stay?.end ? `Nuo ${STAY_DATE_LABEL.format(date)} iki ${STAY_DATE_LABEL.format(stay.end)}` : null;
  const picker = (
    <DatePicker
      days={days}
      selected={selected}
      onSelect={compact ? (next) => {
        select(next);
        if (!stay || (stay.phase === "selectingEnd" && next > date)) setOpen(false);
      } : select}
      icons={icons}
      initialView={compact ? "calendar" : undefined}
      range={stay ? { end: stay.end, selectingEnd: stay.phase === "selectingEnd", lastEnd: stay.lastEnd } : undefined}
    />
  );

  return (
    <section aria-label={stay ? "Nakvynės datos" : "Data"} className="min-w-0 space-y-4">
      {compact ? (
        <div className="space-y-2">
          <label htmlFor={dateId} className="flex items-center gap-2 text-sm font-bold">
            <CalendarBlankIcon size={18} aria-hidden /> {stay ? "Datos" : "Data"}
          </label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button id={dateId} type="button" className="flex min-h-11 w-full items-center justify-between gap-3 border border-line px-3 py-2 text-left text-sm hover:border-ink">
                <span>{stayLabel ?? (selected ? STAY_DATE_LABEL.format(selected) : "Pasirink atvykimo datą")}</span>
                <CalendarBlankIcon size={18} className="shrink-0" aria-hidden />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-96 max-w-(--radix-popover-content-available-width) p-2 sm:p-3" aria-label={stay ? "Nakvynės kalendorius" : "Pirties kalendorius"}>
              {picker}
              {stay && stayLabel ? (
                <button type="button" onClick={() => setOpen(false)} className="mt-3 flex min-h-11 w-full items-center justify-center bg-ink px-3 text-xs font-bold text-dust">
                  Rodyti pasirinkimus
                </button>
              ) : null}
            </PopoverContent>
          </Popover>
        </div>
      ) : picker}
      {stay ? (
        <div role="status" className="space-y-1 text-xs">
          {compact ? <span className="sr-only">{stayLabel}</span> : stayLabel ? (
            <p className="font-bold">{stayLabel}</p>
          ) : (
            <p className="text-copy">Pasirink atvykimo datą.</p>
          )}
          {stay.phase === "selectingEnd" ? (
            <p className="text-copy">Jei nori likti ilgiau, pasirink kitą išvykimo datą. Galima iki {MAX_STAY_NIGHTS} naktų.</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
