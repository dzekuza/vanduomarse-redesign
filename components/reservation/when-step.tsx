"use client";

import type { DayIcon } from "@/components/booking/day-picker";
import { MAX_STAY_NIGHTS } from "@/lib/cabin";
import { DatePicker } from "./date-picker";

export type StayDatePhase = "idle" | "selectingEnd" | "complete";

interface WhenStepProps {
  days: Date[];
  date: Date;
  onDate: (date: Date) => void;
  /** Availability icons under each day. */
  icons: (date: Date) => DayIcon[];
  stay?: {
    phase: StayDatePhase;
    end: Date | null;
    lastEnd: Date;
    onSelect: (date: Date) => void;
  };
}

/** Select the activity day or the arrival and departure of a stay. */
export function WhenStep({ days, date, onDate, icons, stay }: WhenStepProps) {
  return (
    <section aria-label={stay ? "Nakvynės datos" : "Data"} className="min-w-0 space-y-4">
      <DatePicker
        days={days}
        selected={stay?.phase === "idle" ? null : date}
        onSelect={stay?.onSelect ?? onDate}
        icons={icons}
        range={stay ? { end: stay.end, selectingEnd: stay.phase === "selectingEnd", lastEnd: stay.lastEnd } : undefined}
      />
      {stay && stay.phase !== "complete" ? (
        <p role="status" className="text-xs text-copy">
          {stay.phase === "idle" ? "Pasirink atvykimo ir išvykimo datas." : `Pasirink išvykimo datą. Galima iki ${MAX_STAY_NIGHTS} naktų.`}
        </p>
      ) : null}
    </section>
  );
}
