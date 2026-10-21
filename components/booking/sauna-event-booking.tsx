"use client";

import { useState } from "react";
import { ArrowButton } from "./arrow-button";
import { BookingCard, BookingTotal } from "./booking-card";
import { EventList } from "./event-list";
import { Receipt } from "./receipt";
import { StepLabel } from "./step-label";
import { Stepper } from "./stepper";
import { VENUE, at, type CalendarEvent } from "@/lib/calendar";
import { longDateLabel } from "@/lib/sauna";
import { eventReference, type SaunaEvent } from "@/lib/sauna-events";

function eventCalendar(event: SaunaEvent, reference: string, people: number): CalendarEvent {
  const [h, m] = event.time.split(":").map(Number);
  const start = at(event.date, h, m);
  return {
    title: `${event.title} · Pirtis Marse`,
    start,
    // Sessions without a set length block two hours in the calendar.
    end: new Date(start.getTime() + (event.minutes ?? 120) * 60_000),
    details: `Bilietai ${reference}: ${people} asm. ${event.blurb}`,
    location: VENUE,
  };
}

/** Join a scheduled public sauna session: pick an event, buy per-person tickets. */
export function SaunaEventBooking({ events }: { events: SaunaEvent[] }) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [people, setPeople] = useState(1);
  const [confirmed, setConfirmed] = useState<string | null>(null);

  const event = events.find((e) => e.key === selectedKey) ?? null;
  const maxPeople = event ? event.spotsLeft : 1;
  const total = event ? event.pricePerPerson * people : 0;

  function select(key: string) {
    const next = events.find((e) => e.key === key);
    setSelectedKey(key);
    if (next) setPeople((p) => Math.min(p, next.spotsLeft));
  }

  if (confirmed && event) {
    return (
      <Receipt
        title={event.title}
        reference={confirmed}
        rows={[
          { label: "Data", value: longDateLabel(event.date) },
          { label: "Laikas", value: event.minutes ? `${event.time}, ${event.minutes} min` : event.time },
          { label: "Bilietai", value: `${people} asm.` },
          { label: "Vedėjas", value: event.host },
        ]}
        total={total}
        calendar={eventCalendar(event, confirmed, people)}
        resetLabel="Prisijungti prie kito renginio"
        onReset={() => {
          setConfirmed(null);
          setSelectedKey(null);
          setPeople(1);
        }}
      />
    );
  }

  return (
    <BookingCard
      summary={
        <BookingTotal
          note={event ? `${event.title}, ${longDateLabel(event.date)} ${event.time}` : "Pasirink renginį"}
          total={total}
        />
      }
      action={
        <ArrowButton disabled={!event} onClick={() => event && setConfirmed(eventReference(event.key, people))}>
          Prisijungti
        </ArrowButton>
      }
    >
      <div>
        <StepLabel step={1}>Pasirink renginį</StepLabel>
        <EventList events={events} selected={selectedKey} onSelect={select} />
      </div>
      <div>
        <StepLabel step={2}>Bilietai</StepLabel>
        <Stepper label="Žmonių" value={people} onChange={setPeople} min={1} max={Math.max(1, maxPeople)} />
        {event ? <p className="mt-2 text-sm text-ink/60">{event.blurb}</p> : null}
      </div>
    </BookingCard>
  );
}
