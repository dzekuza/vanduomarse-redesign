"use client";

import { ClockCounterClockwiseIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { ACTIVITY_ICON } from "@/components/reservation/activity-icons";
import { DateField } from "@/components/reservation/date-field";
import type { QuadPageData } from "@/lib/data/public-types";
import { dateKey } from "@/lib/sauna";
import { quadTourDepartureSlots, type QuadTourPick } from "./quad-tour-plan";
import { QuadTourCard } from "./quad-tour-card";

interface QuadServiceBookingProps {
  data: QuadPageData;
  days: Date[];
  /** The chosen day, or null until the visitor picks one. */
  date: Date | null;
  /** The tour in the plan: route, start, quads and gear. */
  pick: QuadTourPick | null;
  /** Hours the visitor's sauna booking already holds; a tour cannot start inside them. */
  busyHours: readonly number[];
  busy: boolean;
  onDate: (date: Date) => void;
  onPick: (pick: QuadTourPick | null) => void;
}

/**
 * Quad booking: a date, then one card per route with its own start time, quads and gear.
 * Routes, departures, minimum quads, gear and prices are database rows (`quad_tour_routes`);
 * the plan panel and checkout dialog take the selected tour from here.
 */
export function QuadServiceBooking({ data, days, date, pick, busyHours, busy, onDate, onPick }: QuadServiceBookingProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const day = date ? dateKey(date) : null;
  const note = data.settings.tourCancellationNote;

  if (data.tourRoutes.length === 0) {
    return <p className="text-sm text-copy">Keturračių šiuo metu nesiūlome. Susisiek su komanda.</p>;
  }

  return (
    <div className="space-y-5">
      <DateField
        date={date}
        days={days}
        disabled={busy}
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        onSelect={onDate}
        icons={(d) => {
          const available = data.tourRoutes.some((route) => quadTourDepartureSlots(data, dateKey(d), route).some((slot) => slot.free >= route.minUnits));
          return [{ Icon: ACTIVITY_ICON.keturraciai, on: available, label: available ? "Yra laisvų laikų" : "Laisvų laikų nėra" }];
        }}
      />
      {day ? <QuadTourCard key={day} data={data} when={{ day, people: 1 }} busy={busyHours} pick={pick} onChange={onPick} /> : null}
      {note ? (
        <p className="flex items-start gap-3 text-xs text-copy">
          <ClockCounterClockwiseIcon size={18} aria-hidden className="shrink-0" />
          <span>{note}</span>
        </p>
      ) : null}
    </div>
  );
}
