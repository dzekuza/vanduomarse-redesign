"use client";

import type { DayIcon } from "@/components/booking/day-picker";
import { MAX_STAY_NIGHTS } from "@/lib/cabin";
import type { ReservationDayDetails } from "./day-cell";
import { DateField } from "./date-field";

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
    dayDetails: (date: Date) => ReservationDayDetails;
  };
}

const STAY_DATE_LABEL = new Intl.DateTimeFormat("lt-LT", { day: "numeric", month: "long" });

function unavailableDayDetails(icons: DayIcon[], size: number): ReservationDayDetails {
  const unavailable = icons.filter(({ on }) => !on);
  return {
    available: icons.some(({ on }) => on),
    label: unavailable.map(({ label }) => label).join(". ") || "Visos veiklos turi laisvų vietų",
    indicator: (
      <span className="flex h-3 items-center justify-center gap-px text-rust-ink">
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
    <DateField
      label={stay ? "Nakvynės datos" : "Data"}
      days={days}
      date={selected}
      selectionLabel={stayLabel ?? undefined}
      onSelect={select}
      icons={stay || unavailableOnly ? undefined : icons}
      dayDetails={stay?.dayDetails ?? (unavailableOnly ? (day, view) => unavailableDayDetails(icons(day), view === "calendar" ? 10 : 12) : undefined)}
      range={stay ? { end: stay.end, selectingEnd: stay.phase === "selectingEnd", lastEnd: stay.lastEnd } : undefined}
      footer={<>
        {unavailableOnly && !stay ? <p className="text-xs text-copy">Raudona ikona žymi veiklą be laisvų vietų ar laikų.</p> : null}
        {stay?.phase === "selectingEnd" ? (
          <p className="text-xs text-copy">Jei nori likti ilgiau, pasirink kitą išvykimo datą. Galima iki {MAX_STAY_NIGHTS} naktų.</p>
        ) : null}
      </>}
    />
  );
}
