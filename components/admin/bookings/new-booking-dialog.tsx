"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { FormField } from "../form-field";
import { BookingChooser } from "./booking-chooser";
import { BookingCustomerFields } from "./booking-customer-fields";
import { BookingExtrasFields } from "./booking-extras-fields";
import { NewRentalDialog } from "../quads/new-rental-dialog";
import { NewTourDialog } from "../quads/new-tour-dialog";
import { BookingWhenFields } from "./booking-when-fields";
import { newBookingSchema, type NewBookingValues } from "./new-booking-schema";
import { bookingOptionsOn } from "@/lib/admin/booking-options";
import { formatDay, formatEur } from "@/lib/admin/format";
import { freeHoursFrom, freeStartHours, fullStayNights, saunaSlice } from "@/lib/admin/occupancy";
import { hasPermission } from "@/lib/admin/permissions";
import { pickStayType } from "@/lib/cabin";
import { DEFAULT_SAUNA_RATES, dateKey, sessionLengths, sessionPrice } from "@/lib/sauna";
import { upsellTotal } from "@/lib/sauna-upsells";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface NewBookingDialogProps {
  onOpenChange: (open: boolean) => void;
  /** Called with the new booking's id so the list can open it. */
  onCreated: (id: string) => void;
  /** Prefills the form, e.g. when opened from a free cell on the Užimtumas grid. A sauna or start time skips the first step; a date alone does not. */
  initial?: { saunaId?: string; date?: string; startHour?: number };
}

/**
 * Staff-entered booking (phone or walk-in). Step 1 lists what can be booked on the date (events and sessions with places
 * left, cabins and camper pitches, private saunas); nothing is preselected. Step 2 is the form for what was chosen:
 * a private sauna slot, a stay, or tickets for an event or session.
 */
export function NewBookingDialog({ onOpenChange, onCreated, initial }: NewBookingDialogProps) {
  const { me, bookings, blocks, saunas, events, upsells: catalogue, stayTypes, quadTypes, quadTourRoutes, createBooking, createEventTicket } = useAdmin();
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [quad, setQuad] = useState<{ kind: "rental" } | { kind: "tour"; routeId: string } | null>(null);
  const [step, setStep] = useState<"choose" | "form">(initial?.startHour != null || initial?.saunaId ? "form" : "choose");
  const { register, control, handleSubmit, setValue, setError, formState } = useForm<NewBookingValues>({
    resolver: zodResolver(newBookingSchema),
    defaultValues: {
      kind: "pirtis",
      saunaId: initial?.saunaId ?? (saunas.find((s) => s.active) ?? saunas[0])?.id ?? "",
      stayTypeId: "",
      eventId: "",
      date: initial?.date && initial.date >= dateKey(new Date()) ? initial.date : dateKey(new Date()),
      startHour: initial?.startHour != null ? String(initial.startHour) : "",
      hours: "",
      nights: "1",
      guests: "2",
      name: "",
      phone: "",
      email: "",
      status: "patvirtinta",
      source: "telefonu",
      priceOverride: "",
      note: "",
    },
  });
  const [kind, saunaId, date, startHour, hours, nights, guests, priceOverride, stayTypeId, eventId] = useWatch({
    control,
    name: ["kind", "saunaId", "date", "startHour", "hours", "nights", "guests", "priceOverride", "stayTypeId", "eventId"],
  });
  const err = formState.errors;
  const party = Number(guests) || 0;
  const sauna = kind === "pirtis";
  const ticket = kind === "renginys";
  const stayKind = kind === "namelis" || kind === "kemperis" ? kind : null;
  const chosen = saunas.find((s) => s.id === saunaId);
  const chosenEvent = ticket ? events.find((e) => e.id === eventId) : undefined;
  const saunaRates = chosen?.rates ?? DEFAULT_SAUNA_RATES;
  const upsells = chosen ? catalogue.filter((u) => chosen.upsellIds.includes(u.id)) : [];
  const slice = saunaSlice(bookings, blocks, saunaId);
  const options = useMemo(() => {
    const all = bookingOptionsOn(date, { events, bookings, blocks, saunas, stayTypes });
    // Without Renginiai, only the guided quad tours (category keturratis) can be sold here, as the tickets policy allows.
    return hasPermission(me, "renginiai") ? all : { ...all, events: all.events.filter(({ event }) => event.category === "keturratis") };
  }, [date, events, bookings, blocks, saunas, stayTypes, me]);

  const starts = sauna && chosen && date ? freeStartHours(slice.bookings, slice.blocks, saunaRates, date) : [];
  const run = sauna && chosen && startHour ? freeHoursFrom(slice.bookings, slice.blocks, saunaRates, date, Number(startHour)) : 0;
  const lengths = sessionLengths(saunaRates, date || undefined).filter((h) => h <= run);
  // A stay uses the type staff picked in step 1; without one, the smallest active type that fits the party (the server picks the same).
  const stayType = stayKind ? (stayTypes.find((t) => t.id === stayTypeId && t.kind === stayKind && t.active) ?? pickStayType(stayTypes, stayKind, party)) : undefined;
  const placesLeft = chosenEvent && chosenEvent.capacity !== null ? Math.max(0, chosenEvent.capacity - chosenEvent.sold - chosenEvent.held) : null;
  const maxGuests = sauna
    ? saunaRates.maxParty
    : ticket
      ? (placesLeft ?? 500)
      : (stayType?.maxGuests ?? Math.max(0, ...stayTypes.filter((t) => t.kind === kind && t.active).map((t) => t.maxGuests)));

  const extrasCtx = { partySize: party, hours: Number(hours) || 0 };
  const stayRate = stayType?.pricePerNight ?? 0;
  const extrasPrice = upsells.reduce((sum, u) => sum + (u.active ? upsellTotal(u, extras[u.id] ?? 0, extrasCtx) : 0), 0);
  const computed = ticket
    ? (chosenEvent?.price ?? 0) * party
    : sauna
      ? (hours ? sessionPrice(Number(hours), party, saunaRates, date || undefined) : 0) + extrasPrice
      : stayRate * (Number(nights) || 0);
  const total = priceOverride && !ticket ? Number(priceOverride) : computed;

  const resetSlot = () => {
    setValue("startHour", "");
    setValue("hours", "");
  };

  /** What step 2 is about, with the way back to step 1. */
  const summary = ticket
    ? { title: chosenEvent?.title ?? "Renginys", detail: chosenEvent ? `${formatDay(chosenEvent.date)} · ${chosenEvent.time} · ${chosenEvent.place}` : "" }
    : sauna
      ? { title: chosen?.name ?? "Pirtis", detail: "Privati pirtis" }
      : { title: stayType?.label ?? "Apgyvendinimas", detail: stayType ? `Iki ${stayType.maxGuests} žm. · ${formatEur(stayType.pricePerNight)} / naktį` : "" };

  const submit = handleSubmit(async (v) => {
    if (party > maxGuests) return setError("guests", { message: ticket ? `Liko vietų: ${maxGuests}` : `Daugiausia ${maxGuests} žm.` });
    if (ticket) {
      if (!chosenEvent) return setError("eventId", { message: "Pasirinkite renginį." });
      const created = await createEventTicket({
        eventId: chosenEvent.id,
        customer: { name: v.name, phone: v.phone, email: v.email },
        people: party,
        status: v.status,
        source: v.source,
      });
      if ("error" in created) return setError("guests", { message: created.error.message });
      toast.success(`${created.data.reference} sukurta`);
      return onOpenChange(false);
    }
    if (sauna && freeHoursFrom(slice.bookings, slice.blocks, saunaRates, v.date, Number(v.startHour)) < Number(v.hours))
      return setError("startHour", { message: "Šis laikas jau užimtas – pasirinkite kitą." });
    if (!sauna) {
      if (!stayType) return setError("kind", { message: "Šio tipo nakvynės nėra – pridėkite ją skiltyje Namukai." });
      const full = fullStayNights(bookings, v.date, Number(v.nights), stayType);
      if (full.length) return setError("nights", { message: `„${stayType.label}“ užimti: ${full.join(", ")}` });
    }
    const result = await createBooking({
      kind: v.kind === "pirtis" ? "pirtis" : v.kind === "kemperis" ? "kemperis" : "namelis",
      ...(sauna ? { saunaId: v.saunaId } : { stayTypeId: stayType?.id }),
      customer: { name: v.name, phone: v.phone, email: v.email },
      date: v.date,
      ...(sauna ? { startHour: Number(v.startHour), hours: Number(v.hours) } : { nights: Number(v.nights) }),
      guests: party,
      extras: sauna ? extras : {},
      total,
      status: v.status,
      source: v.source,
      note: v.note,
    });
    // The database has the final say on conflicts (another booking may have landed meanwhile).
    if ("error" in result) {
      return setError(sauna ? "startHour" : "nights", { message: result.error.message });
    }
    toast.success(`${result.data.reference} sukurta`);
    onOpenChange(false);
    onCreated(result.data.id);
  });

  const choose = (patch: { kind: NewBookingValues["kind"]; saunaId?: string; stayTypeId?: string; eventId?: string; date?: string }) => {
    setValue("kind", patch.kind);
    setValue("stayTypeId", patch.stayTypeId ?? "");
    setValue("eventId", patch.eventId ?? "");
    if (patch.saunaId) setValue("saunaId", patch.saunaId);
    if (patch.date) setValue("date", patch.date);
    resetSlot();
    setExtras({});
    setStep("form");
  };

  // Quads have their own forms (fleet, hours, riders; or a tour with its route, gear and minimum quads); they open on the chosen date.
  if (quad?.kind === "rental") return <NewRentalDialog date={date} onOpenChange={onOpenChange} />;
  if (quad?.kind === "tour") return <NewTourDialog date={date} routeId={quad.routeId} onOpenChange={onOpenChange} />;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nauja rezervacija</DialogTitle>
          <DialogDescription>{step === "choose" ? "Pasirinkite datą ir ką rezervuoti. Rodoma, kas tą dieną laisva." : "Kai klientas skambina ar atvyksta. Rodomi tik laisvi laikai."}</DialogDescription>
        </DialogHeader>

        {step === "choose" ? (
          <BookingChooser
            date={date}
            onDateChange={(d) => setValue("date", d)}
            options={options}
            canTickets={hasPermission(me, "renginiai") || hasPermission(me, "keturraciai")}
            quads={hasPermission(me, "keturraciai") ? { routes: quadTourRoutes.filter((r) => r.active), types: quadTypes } : null}
            onPickTour={(route) => setQuad({ kind: "tour", routeId: route.id })}
            onPickRental={() => setQuad({ kind: "rental" })}
            onPickEvent={(e) => choose({ kind: "renginys", eventId: e.id, date: e.date })}
            onPickSauna={(sa) => choose({ kind: "pirtis", saunaId: sa.id })}
            onPickStay={(t) => choose({ kind: t.kind, stayTypeId: t.id })}
          />
        ) : (
          <form id="new-booking" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2 sm:col-span-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{summary.title}</p>
                <p className="truncate text-xs text-muted-foreground">{summary.detail}</p>
              </div>
              <Button type="button" variant="outline" size="sm" className="min-h-11 shrink-0" onClick={() => setStep("choose")}>
                Keisti
              </Button>
            </div>
            {err.kind?.message ? <p className="text-xs text-destructive sm:col-span-2">{err.kind.message}</p> : null}

            {ticket ? (
              <FormField id="nb-guests" label="Žmonių" error={err.guests?.message} hint={placesLeft === null ? "Be limito" : `Liko vietų: ${placesLeft}`} className="sm:col-span-2">
                <Input id="nb-guests" inputMode="numeric" aria-invalid={!!err.guests} {...register("guests")} />
              </FormField>
            ) : (
              <BookingWhenFields
                control={control}
                register={register}
                errors={err}
                kind={kind}
                starts={starts}
                lengths={lengths}
                maxGuests={maxGuests}
                onSaunaChange={() => {
                  resetSlot();
                  setExtras({});
                }}
                onDateChange={resetSlot}
                onStartChange={() => setValue("hours", "")}
              />
            )}

            {sauna ? (
              <BookingExtrasFields
                upsells={upsells}
                quantities={extras}
                onChange={(id, q) => setExtras((e) => ({ ...e, [id]: q }))}
                {...extrasCtx}
              />
            ) : null}

            <BookingCustomerFields control={control} register={register} setValue={setValue} errors={err} showNote={!ticket} />
            {ticket ? null : (
              <FormField
                id="nb-price"
                label="Kita kaina, €"
                error={err.priceOverride?.message}
                hint={`Apskaičiuota: ${formatEur(computed)}. Palikite tuščią.`}
                className="sm:col-span-2"
              >
                <Input id="nb-price" inputMode="decimal" placeholder={String(computed)} aria-invalid={!!err.priceOverride} {...register("priceOverride")} />
              </FormField>
            )}
          </form>
        )}

        <DialogFooter className="items-center justify-between *:flex-none">
          {step === "form" ? <p className="font-display text-total font-bold">{formatEur(total)}</p> : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Atšaukti
            </Button>
            {step === "form" ? (
              <Button type="submit" form="new-booking" disabled={formState.isSubmitting}>
                {formState.isSubmitting ? "Kuriama…" : "Sukurti"}
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
