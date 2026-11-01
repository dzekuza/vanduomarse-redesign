"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { createQuadRental } from "@/app/actions/quads";
import { ArrowButton } from "@/components/booking/arrow-button";
import { BookingCard, BookingTotal, type BookingStep } from "@/components/booking/booking-card";
import { DayPicker } from "@/components/booking/day-picker";
import { StepLabel } from "@/components/booking/step-label";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { QuadPageData } from "@/lib/data/public-types";
import { quadContactSchema, type QuadContactValues } from "@/lib/quad-schema";
import { QUAD_DAYS, hourLabel, longestFrom, maxRiders, mostFreeOnDay, rentalPrice } from "@/lib/quads";
import { dateKey, hoursLabel, longDateLabel, nextDays } from "@/lib/sauna";
import { ContactFields } from "./contact-fields";
import { QuadTypeStep } from "./quad-type-step";
import { DurationGrid, StartGrid } from "./quad-time-pickers";
import { RequestConfirmation } from "./request-confirmation";

interface Sent {
  reference: string;
  total: number;
  rows: { label: string; value: string }[];
}

/** Hourly quad rental: day, quad and riders, start, length, contact. Stored as a request staff confirm. */
export function QuadRental({ data }: { data: QuadPageData }) {
  const { today, nowHour, types, settings, taken } = data;
  const days = useMemo(() => nextDays(today, QUAD_DAYS), [today]);
  // First day that still has a free hour, so a visit after closing doesn't open on an all-"Užimta" day.
  const [date, setDate] = useState(
    () =>
      days.find((d) => {
        const k = dateKey(d);
        return types[0] && mostFreeOnDay(types[0], taken, k, settings, k === today ? nowHour + 1 : settings.openHour) > 0;
      }) ?? days[0],
  );
  const [typeId, setTypeId] = useState(types[0]?.id ?? "");
  const [units, setUnits] = useState(1);
  const [riders, setRiders] = useState(1);
  const [startHour, setStartHour] = useState<number | null>(null);
  const [hours, setHours] = useState(1);
  const [sent, setSent] = useState<Sent | null>(null);
  const form = useForm<QuadContactValues>({
    resolver: zodResolver(quadContactSchema),
    defaultValues: { customerName: "", customerPhone: "", customerEmail: "", note: "", website: "" },
  });

  const type = types.find((t) => t.id === typeId);
  if (!type) return <p className="border border-ink bg-foam p-6 text-ink/80">Šiuo metu keturračių nenuomojame. Skambinkite ir padėsime.</p>;

  const day = dateKey(date);
  const pastHour = day === today ? nowHour : -1;
  const longest = startHour === null || startHour <= pastHour ? 0 : longestFrom(type, taken, day, startHour, units, settings);
  const start = longest > 0 ? startHour : null;
  const length = Math.min(hours, Math.max(longest, 1));
  const ridersShown = Math.min(riders, maxRiders(type, units));
  const total = start === null ? 0 : rentalPrice(type, length, units);

  const dayNote = (d: Date) => {
    const k = dateKey(d);
    const free = mostFreeOnDay(type, taken, k, settings, k === today ? nowHour + 1 : settings.openHour);
    return { text: free >= units ? `liko ${free}` : "Užimta", disabled: free < units };
  };

  const submit = form.handleSubmit(async (c) => {
    if (start === null) return;
    const result = await createQuadRental({
      quadTypeId: type.id,
      date: day,
      startHour: start,
      hours: length,
      units,
      riders: ridersShown,
      note: c.note,
      customerName: c.customerName,
      customerPhone: c.customerPhone,
      customerEmail: c.customerEmail,
      website: c.website,
      verificationToken: c.verificationToken,
    });
    if ("error" in result) return form.setError("root", { message: result.error.message });
    setSent({
      ...result.data,
      rows: [
        { label: "Data", value: longDateLabel(date) },
        { label: "Laikas", value: `${hourLabel(start)}-${hourLabel(start + length)}` },
        { label: "Keturračiai", value: `${units} × ${type.name}` },
        { label: "Važiuotojai", value: String(ridersShown) },
      ],
    });
  });

  if (sent) {
    return (
      <RequestConfirmation
        title="Keturračių nuoma"
        {...sent}
        resetLabel="Pateikti kitą užklausą"
        onReset={() => {
          setSent(null);
          setStartHour(null);
          form.reset();
        }}
      />
    );
  }

  const steps: BookingStep[] = [
    {
      id: "day",
      label: "Diena",
      content: (
        <div>
          <StepLabel step={1}>Pasirink dieną</StepLabel>
          <DayPicker days={days} selected={date} onSelect={(d) => { setDate(d); setStartHour(null); }} note={dayNote} />
        </div>
      ),
    },
    {
      id: "type",
      label: "Keturratis ir važiuotojai",
      content: (
        <div>
          <StepLabel step={2}>Keturratis ir važiuotojai</StepLabel>
          <QuadTypeStep
            types={types}
            typeId={type.id}
            onType={(id) => { setTypeId(id); setUnits(1); setRiders(1); setStartHour(null); }}
            units={units}
            onUnits={(n) => { setUnits(n); setStartHour(null); }}
            riders={ridersShown}
            onRiders={setRiders}
          />
        </div>
      ),
    },
    {
      id: "time",
      label: "Laikas",
      ready: start !== null,
      content: (
        <>
          <div>
            <StepLabel step={3}>Pradžios laikas</StepLabel>
            <StartGrid type={type} units={units} settings={settings} taken={taken} day={day} pastHour={pastHour} selected={start} onSelect={setStartHour} />
          </div>
          {start !== null ? (
            <div>
              <StepLabel step={4}>Trukmė</StepLabel>
              <DurationGrid type={type} units={units} settings={settings} taken={taken} day={day} startHour={start} selected={length} onSelect={setHours} />
            </div>
          ) : null}
        </>
      ),
    },
    {
      id: "contact",
      label: "Kontaktai",
      content: (
        <div className="space-y-4">
          <StepLabel step={start === null ? 4 : 5}>Kontaktai</StepLabel>
          <ContactFields idPrefix="quad" />
          <div className="space-y-1.5">
            <Label htmlFor="quad-note">Pastaba (nebūtina)</Label>
            <Textarea id="quad-note" rows={2} {...form.register("note")} />
          </div>
          {form.formState.errors.root ? <p role="alert" className="text-sm text-destructive">{form.formState.errors.root.message}</p> : null}
        </div>
      ),
    },
  ];

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate>
        <BookingCard
          steps={steps}
          summary={
            <BookingTotal
              note={start === null ? "Pasirink dieną ir laiką" : `${date.toLocaleDateString("lt-LT")}, ${hourLabel(start)}-${hourLabel(start + length)}, ${hoursLabel(length)}`}
              total={total}
            />
          }
          action={
            <ArrowButton type="submit" disabled={start === null || form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Siunčiama..." : "Siųsti užklausą"}
            </ArrowButton>
          }
        />
      </form>
    </FormProvider>
  );
}
