"use client";

import { ClockCounterClockwiseIcon, IdentificationCardIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { ACTIVITY_ICON } from "@/components/reservation/activity-icons";
import { DateField } from "@/components/reservation/date-field";
import type { QuadPageData } from "@/lib/data/public-types";
import { dateKey } from "@/lib/sauna";
import { quadTourStarts, type QuadTourPick } from "./quad-tour-plan";
import { QuadRoutePicker } from "./quad-route-picker";
import { QuadTourFields } from "./quad-tour-fields";

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
  /** Where "Daugiau apie trasas" scrolls to (the page's price section); the link is left out without it. */
  pricesHref?: string;
  onDate: (date: Date) => void;
  onPick: (pick: QuadTourPick | null) => void;
}

/**
 * Quad booking: pick a route, then a date, then a start time (with quads and gear).
 * Tours are not scheduled: any start the free fleet covers can be booked. Routes, minimum quads, gear and prices are database rows (`quad_tour_routes`);
 * the plan panel and checkout dialog take the selected tour from here.
 */
export function QuadServiceBooking({ data, days, date, pick, busyHours, busy, pricesHref, onDate, onPick }: QuadServiceBookingProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [chosenRoute, setChosenRoute] = useState<string | null>(null);
  // A tour already in the plan opens on its route; a single route needs no choice.
  const routeId = chosenRoute ?? pick?.routeId ?? (data.tourRoutes.length === 1 ? data.tourRoutes[0].id : null);
  const route = data.tourRoutes.find(({ id }) => id === routeId) ?? null;
  const day = date ? dateKey(date) : null;
  const note = data.settings.tourCancellationNote;

  if (data.tourRoutes.length === 0) {
    return <p className="text-sm text-copy">Keturračių šiuo metu nesiūlome. Susisiek su komanda.</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <QuadRoutePicker routes={data.tourRoutes} value={routeId} disabled={busy} onChange={setChosenRoute} />
        {pricesHref ? (
          <Link href={pricesHref} className="inline-flex min-h-11 items-center text-xs underline underline-offset-4 hover:text-rust">Daugiau apie trasas</Link>
        ) : null}
      </div>
      <DateField
        date={date}
        days={days}
        disabled={busy || !route}
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        onSelect={onDate}
        icons={(d) => {
          const available = route !== null && quadTourStarts(data, dateKey(d), route, busyHours).length > 0;
          return [{ Icon: ACTIVITY_ICON.keturraciai, on: available, label: available ? "Yra laisvų laikų" : "Laisvų laikų nėra" }];
        }}
      />
      <QuadTourFields data={data} route={route} day={day} busy={busyHours} pick={pick} onChange={onPick} />
      <ul className="space-y-2 border-t border-line pt-4 text-xs text-copy">
        {note ? (
          <li className="flex items-start gap-3">
            <ClockCounterClockwiseIcon size={18} aria-hidden className="shrink-0" />
            <span>{note}</span>
          </li>
        ) : null}
        <li className="flex items-start gap-3">
          <IdentificationCardIcon size={18} aria-hidden className="shrink-0" />
          <span>Atvykdamas turėk asmens tapatybės dokumentą.</span>
        </li>
      </ul>
    </div>
  );
}
