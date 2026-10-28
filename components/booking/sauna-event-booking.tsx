"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { createEventTicket } from "@/app/actions/requests";
import { ArrowButton } from "./arrow-button";
import { BookingCard, BookingTotal } from "./booking-card";
import { ContactStep } from "./contact-step";
import { EventList } from "./event-list";
import { Receipt } from "./receipt";
import { StepLabel } from "./step-label";
import { Stepper } from "./stepper";
import { VENUE, at, type CalendarEvent } from "@/lib/calendar";
import { longDateLabel } from "@/lib/sauna";
import { contactSchema, type ContactInput } from "@/lib/request-schema";
import type { SaunaEvent } from "@/lib/sauna-events";

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
  const [confirmed, setConfirmed] = useState<{ reference: string; total: number } | null>(null);

  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { customerName: "", customerPhone: "", customerEmail: "", website: "" },
  });
  const event = events.find((e) => e.key === selectedKey) ?? null;
  const maxPeople = event ? event.spotsLeft : 1;
  const total = event ? event.pricePerPerson * people : 0;

  function select(key: string) {
    const next = events.find((e) => e.key === key);
    setSelectedKey(key);
    if (next) setPeople((p) => Math.min(p, next.spotsLeft));
  }

  const submit = form.handleSubmit(async (contact) => {
    if (!event) return;
    const result = await createEventTicket({ eventId: event.key, people, ...contact });
    if ("error" in result) return form.setError("root", { message: result.error.message });
    setConfirmed(result.data);
  });

  if (confirmed && event) {
    return (
      <Receipt
        title={event.title}
        reference={confirmed.reference}
        rows={[
          { label: "Data", value: longDateLabel(event.date) },
          { label: "Laikas", value: event.minutes ? `${event.time}, ${event.minutes} min` : event.time },
          { label: "Bilietai", value: `${people} asm.` },
          { label: "Vedėjas", value: event.host },
        ]}
        total={confirmed.total}
        calendar={eventCalendar(event, confirmed.reference, people)}
        resetLabel="Prisijungti prie kito renginio"
        onReset={() => {
          setConfirmed(null);
          setSelectedKey(null);
          setPeople(1);
          form.reset();
        }}
      />
    );
  }

  return (
    <FormProvider {...form}>
    <form onSubmit={submit} noValidate>
    <BookingCard
      summary={
        <BookingTotal
          note={event ? `${event.title}, ${longDateLabel(event.date)} ${event.time}` : "Pasirink renginį"}
          total={total}
        />
      }
      action={
        <ArrowButton type="submit" disabled={!event || form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Siunčiama..." : "Prisijungti"}
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
      <ContactStep step={3} idPrefix="event" />
    </BookingCard>
    </form>
    </FormProvider>
  );
}
