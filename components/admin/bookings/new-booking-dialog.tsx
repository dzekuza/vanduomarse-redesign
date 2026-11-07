"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { FormField } from "../form-field";
import { BookingCustomerFields } from "./booking-customer-fields";
import { BookingExtrasFields } from "./booking-extras-fields";
import { BookingWhenFields } from "./booking-when-fields";
import { STAY_MAX_GUESTS, newBookingSchema, type NewBookingValues } from "./new-booking-schema";
import { formatEur } from "@/lib/admin/format";
import { freeHoursFrom, freeStartHours, fullCabinNights, saunaSlice } from "@/lib/admin/occupancy";
import { ROOM_TYPES } from "@/lib/cabin";
import { DEFAULT_SAUNA_RATES, dateKey, sessionPrice } from "@/lib/sauna";
import { upsellTotal } from "@/lib/sauna-upsells";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NewBookingDialogProps {
  onOpenChange: (open: boolean) => void;
  /** Called with the new booking's id so the list can open it. */
  onCreated: (id: string) => void;
  /** Prefills the form, e.g. when opened from a free cell on the Užimtumas grid. */
  initial?: { saunaId?: string; date?: string; startHour?: number };
}

const range = (from: number, to: number) => (to < from ? [] : Array.from({ length: to - from + 1 }, (_, i) => from + i));

/** Staff-entered booking (phone or walk-in): free slots only, price from admin rates. */
export function NewBookingDialog({ onOpenChange, onCreated, initial }: NewBookingDialogProps) {
  const { bookings, blocks, saunas, upsells: catalogue, prices, createBooking } = useAdmin();
  const [extras, setExtras] = useState<Record<string, number>>({});
  const { register, control, handleSubmit, setValue, setError, formState } = useForm<NewBookingValues>({
    resolver: zodResolver(newBookingSchema),
    defaultValues: {
      kind: "pirtis",
      saunaId: initial?.saunaId ?? (saunas.find((s) => s.active) ?? saunas[0])?.id ?? "",
      date: initial?.date ?? dateKey(new Date()),
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
  const [kind, saunaId, date, startHour, hours, nights, guests, priceOverride] = useWatch({
    control,
    name: ["kind", "saunaId", "date", "startHour", "hours", "nights", "guests", "priceOverride"],
  });
  const err = formState.errors;
  const party = Number(guests) || 0;
  const sauna = kind === "pirtis";
  const chosen = saunas.find((s) => s.id === saunaId);
  const saunaRates = chosen?.rates ?? DEFAULT_SAUNA_RATES;
  const upsells = chosen ? catalogue.filter((u) => chosen.upsellIds.includes(u.id)) : [];
  const slice = saunaSlice(bookings, blocks, saunaId);

  const starts = sauna && chosen && date ? freeStartHours(slice.bookings, slice.blocks, saunaRates, date) : [];
  const run = sauna && chosen && startHour ? freeHoursFrom(slice.bookings, slice.blocks, saunaRates, date, Number(startHour)) : 0;
  const lengths = range(saunaRates.minHours, run);
  const maxGuests = sauna ? saunaRates.maxParty : STAY_MAX_GUESTS[kind];

  const extrasCtx = { partySize: party, hours: Number(hours) || 0 };
  const stayRate = sauna ? 0 : (prices.find((p) => p.id === `room-${kind}`)?.value ?? ROOM_TYPES.find((r) => r.id === kind)!.pricePerNight);
  const extrasPrice = upsells.reduce((sum, u) => sum + (u.active ? upsellTotal(u, extras[u.id] ?? 0, extrasCtx) : 0), 0);
  const computed = sauna ? (hours ? sessionPrice(Number(hours), party, saunaRates) : 0) + extrasPrice : stayRate * (Number(nights) || 0);
  const total = priceOverride ? Number(priceOverride) : computed;

  const resetSlot = () => {
    setValue("startHour", "");
    setValue("hours", "");
  };

  const submit = handleSubmit(async (v) => {
    if (party > maxGuests) return setError("guests", { message: `Daugiausia ${maxGuests} žm.` });
    if (sauna && freeHoursFrom(slice.bookings, slice.blocks, saunaRates, v.date, Number(v.startHour)) < Number(v.hours))
      return setError("startHour", { message: "Šis laikas jau užimtas – pasirinkite kitą." });
    if (kind === "namelis") {
      const full = fullCabinNights(bookings, v.date, Number(v.nights));
      if (full.length) return setError("nights", { message: `Visi nameliai užimti: ${full.join(", ")}` });
    }
    const result = await createBooking({
      kind: v.kind,
      ...(sauna ? { saunaId: v.saunaId } : {}),
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

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nauja rezervacija</DialogTitle>
          <DialogDescription>Kai klientas skambina ar atvyksta. Rodomi tik laisvi laikai.</DialogDescription>
        </DialogHeader>
        <form id="new-booking" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Tabs
            value={kind}
            onValueChange={(k) => {
              setValue("kind", k as NewBookingValues["kind"]);
              resetSlot();
              setExtras({});
            }}
            className="sm:col-span-2"
          >
            <TabsList className="w-full">
              <TabsTrigger value="pirtis">Pirtis</TabsTrigger>
              <TabsTrigger value="namelis">Namelis</TabsTrigger>
              <TabsTrigger value="kemperis">Kemperis</TabsTrigger>
            </TabsList>
          </Tabs>

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

          {sauna ? (
            <BookingExtrasFields
              upsells={upsells}
              quantities={extras}
              onChange={(id, q) => setExtras((e) => ({ ...e, [id]: q }))}
              {...extrasCtx}
            />
          ) : null}

          <BookingCustomerFields control={control} register={register} errors={err} />
          <FormField
            id="nb-price"
            label="Kita kaina, €"
            error={err.priceOverride?.message}
            hint={`Apskaičiuota: ${formatEur(computed)}. Palikite tuščią.`}
            className="sm:col-span-2"
          >
            <Input id="nb-price" inputMode="decimal" placeholder={String(computed)} aria-invalid={!!err.priceOverride} {...register("priceOverride")} />
          </FormField>
        </form>
        <DialogFooter className="items-center justify-between *:flex-none">
          <p className="font-display text-total font-bold">{formatEur(total)}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Atšaukti
            </Button>
            <Button type="submit" form="new-booking" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? "Kuriama…" : "Sukurti"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
