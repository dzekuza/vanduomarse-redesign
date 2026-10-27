"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { createTourTicket } from "@/app/actions/quads";
import { ArrowButton } from "@/components/booking/arrow-button";
import { BookingCard, BookingTotal } from "@/components/booking/booking-card";
import { EventList } from "@/components/booking/event-list";
import { StepLabel } from "@/components/booking/step-label";
import { Stepper } from "@/components/booking/stepper";
import { tourContactSchema, type TourContactValues } from "@/lib/quad-schema";
import type { QuadTourData } from "@/lib/quads";
import { longDateLabel } from "@/lib/sauna";
import { toSaunaEvent } from "@/lib/sauna-events";
import { ContactFields } from "./contact-fields";
import { RequestConfirmation } from "./request-confirmation";

/** Guided quad tours: pick a departure, choose seats. Stored as a request staff confirm. */
export function TourBooking({ tours }: { tours: QuadTourData[] }) {
  const events = useMemo(() => tours.map((t) => toSaunaEvent({ ...t, host: t.place })), [tours]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [people, setPeople] = useState(1);
  const [sent, setSent] = useState<{ reference: string; total: number } | null>(null);
  const form = useForm<TourContactValues>({
    resolver: zodResolver(tourContactSchema),
    defaultValues: { customerName: "", customerPhone: "", customerEmail: "", website: "" },
  });
  const event = events.find((e) => e.key === selectedKey) ?? null;
  const seats = event ? Math.min(people, Math.max(1, event.spotsLeft)) : 1;
  const total = event ? event.pricePerPerson * seats : 0;

  const submit = form.handleSubmit(async (c) => {
    if (!event) return;
    const result = await createTourTicket({ eventId: event.key, people: seats, ...c });
    if ("error" in result) return form.setError("root", { message: result.error.message });
    setSent(result.data);
  });

  if (events.length === 0) {
    return <p className="border border-ink bg-foam p-6 text-ink/80">Artimiausių žygių kol kas nėra. Užsukite vėliau arba skambinkite.</p>;
  }

  if (sent && event) {
    return (
      <RequestConfirmation
        title={event.title}
        {...sent}
        rows={[
          { label: "Data", value: longDateLabel(event.date) },
          { label: "Pradžia", value: event.minutes ? `${event.time}, ${event.minutes} min` : event.time },
          { label: "Vietos", value: `${seats} asm.` },
          { label: "Vieta", value: event.host },
        ]}
        resetLabel="Registruotis į kitą žygį"
        onReset={() => {
          setSent(null);
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
          summary={<BookingTotal note={event ? `${event.title}, ${longDateLabel(event.date)} ${event.time}` : "Pasirink žygį"} total={total} />}
          action={
            <ArrowButton type="submit" disabled={!event || form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Siunčiama..." : "Registruotis"}
            </ArrowButton>
          }
        >
          <div>
            <StepLabel step={1}>Pasirink žygį</StepLabel>
            <EventList events={events} selected={selectedKey} onSelect={setSelectedKey} />
          </div>
          <div>
            <StepLabel step={2}>Vietos</StepLabel>
            <Stepper label="Žmonių" value={seats} onChange={setPeople} min={1} max={Math.max(1, event?.spotsLeft ?? 1)} />
            {event?.blurb ? <p className="mt-2 text-sm text-ink/60">{event.blurb}</p> : null}
          </div>
          <div className="space-y-4">
            <StepLabel step={3}>Kontaktai</StepLabel>
            <ContactFields idPrefix="tour" />
            {form.formState.errors.root ? <p role="alert" className="text-sm text-destructive">{form.formState.errors.root.message}</p> : null}
          </div>
        </BookingCard>
      </form>
    </FormProvider>
  );
}
