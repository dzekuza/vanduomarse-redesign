"use client";

import { useState } from "react";
import { ArrowLink } from "@/components/arrow-link";
import { ArrowButton } from "@/components/booking/arrow-button";
import { Panel } from "@/components/panel";
import { PhoneGate } from "@/components/booking/phone-gate";
import { AvailabilityCount } from "@/components/services/availability-count";
import { CategoryTag } from "./category-tag";
import { EventRegister } from "./event-register";
import { longDateLabel, weekdayLabel } from "@/lib/sauna";
import type { ParkEvent } from "@/lib/park-events";

/** One event in the Renginiai feed: date block, details, price and call to action. */
export function EventRow({ event }: { event: ParkEvent }) {
  const full = event.spotsLeft === 0;
  const [registering, setRegistering] = useState(false);
  return (
    <Panel as="article" className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-4 bg-foam md:grid-cols-[auto_1fr_auto] md:items-center">
      <div className="flex w-16 flex-col items-center border-r border-line pr-5 md:w-18">
        <span className="text-xs">{weekdayLabel(event.date)}</span>
        <span className="font-display text-total font-bold leading-none">{event.date.getDate()}</span>
        <div className="mt-2 flex flex-col items-center text-xs leading-tight tabular-nums">
          {event.time ? <span className="whitespace-nowrap">{event.time}</span> : null}
          {event.spotsLeft !== undefined ? (
            <span>
              <span className="sr-only">Laisvos vietos </span>
              <AvailabilityCount free={event.spotsLeft} capacity={event.capacity} binary />
            </span>
          ) : null}
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryTag category={event.category} />
          <span className="text-xs text-copy">
            {longDateLabel(event.date)} · {event.place}
          </span>
        </div>
        <h3 className="mt-2 text-item font-bold">{event.title}</h3>
        <p className="mt-1 max-w-xl text-xs leading-relaxed text-copy">{event.blurb}</p>
      </div>
      <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 md:col-span-1 md:flex-col md:items-end md:border-0 md:pt-0">
        <p className="font-display text-figure font-bold md:text-figure">{event.price === null ? "Nemokamai" : `${event.price} €`}</p>
        {full ? (
          <span className="text-xs text-muted-foreground">Išparduota</span>
        ) : event.cta.href === undefined ? (
          <ArrowButton onClick={() => setRegistering((o) => !o)}>{registering ? "Uždaryti" : event.cta.label}</ArrowButton>
        ) : (
          <ArrowLink href={event.cta.href} size="sm">
            {event.cta.label}
          </ArrowLink>
        )}
      </div>
      {registering ? (
        <div className="col-span-2 border-t border-line pt-4 md:col-span-3">
          <PhoneGate>
            <EventRegister eventId={event.key} title={event.title} />
          </PhoneGate>
        </div>
      ) : null}
    </Panel>
  );
}
