"use client";

import type { DayIcon } from "@/components/booking/day-picker";
import { MAX_STAY_NIGHTS } from "@/lib/cabin";
import type { ReservationDayDetails } from "./day-cell";
import { DatePicker } from "./date-picker";

export type StayDatePhase = "idle" | "selectingEnd" | "complete";

interface WhenStepProps {
  days: Date[];
  date: Date;
  onDate: (date: Date) => void;
  /** Availability icons under each day. */
  icons: (date: Date) => DayIcon[];
  unavailableOnly?: boolean;
  stay?: {
    phase: StayDatePhase;
    end: Date | null;
    lastEnd: Date;
    onSelect: (date: Date) => void;
  };
}

const STAY_DATE_LABEL = new Intl.DateTimeFormat("lt-LT", { day: "numeric", month: "long" });

function unavailableDayDetails(icons: DayIcon[], size: number): ReservationDayDetails {
  const unavailable = icons.filter(({ on }) => !on);
  return {
    available: icons.some(({ on }) => on),
    label: unavailable.map(({ label }) => label).join(". ") || "Visos veiklos turi laisvų vietų",
    indicator: (
      <span className="flex h-3 items-center justify-center gap-px text-rust-ink group-aria-pressed/day:text-rust">
        {unavailable.map(({ Icon, label }) => <Icon key={label} size={size} aria-hidden />)}
      </span>
    ),
  };
}

/** Select the activity day or the arrival and departure of a stay. */
export function WhenStep({ days, date, onDate, icons, unavailableOnly, stay }: WhenStepProps) {
  const selected = stay?.phase === "idle" ? null : date;
  const select = stay?.onSelect ?? onDate;
  const stayLabel = stay?.end ? `Nuo ${STAY_DATE_LABEL.format(date)} iki ${STAY_DATE_LABEL.format(stay.end)}` : null;
  return (
    <section aria-label={stay ? "Nakvynės datos" : "Data"} className="min-w-0 space-y-4">
      <DatePicker
        days={days}
        selected={selected}
        onSelect={select}
        icons={unavailableOnly ? undefined : icons}
        dayDetails={unavailableOnly ? (day, view) => unavailableDayDetails(icons(day), view === "calendar" ? 10 : 12) : undefined}
        range={stay ? { end: stay.end, selectingEnd: stay.phase === "selectingEnd", lastEnd: stay.lastEnd } : undefined}
      />
      {unavailableOnly ? <p className="text-xs text-copy">Raudona ikona žymi veiklą be laisvų vietų ar laikų.</p> : null}
      {stay ? (
        <div role="status" className="space-y-1 text-xs">
          {stayLabel ? (
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
