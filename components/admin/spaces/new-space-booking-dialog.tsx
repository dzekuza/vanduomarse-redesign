"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAdmin } from "../admin-store";
import { FormField } from "../form-field";
import { SpacePicker } from "./space-picker";
import { formatEur } from "@/lib/admin/format";
import { SPACES, type SpaceId } from "@/lib/event-pricing";
import { anySpaceClash, spaceLabels, suggestedSpacePrice, windowsOverlap } from "@/lib/space-booking";
import { todayKey } from "@/lib/sauna";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormPhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";

const SPACE_IDS = SPACES.map((s) => s.id) as [SpaceId, ...SpaceId[]];
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pasirinkite laiką.");

const schema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pasirinkite datą."),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pasirinkite datą."),
    startTime: time,
    endTime: time,
    spaces: z.array(z.enum(SPACE_IDS)).min(1, "Pasirinkite bent vieną erdvę."),
    name: z.string().trim().min(2, "Įveskite vardą.").max(80),
    surname: z.string().trim().min(2, "Įveskite pavardę.").max(80),
    phone: z.string().trim().regex(/^\+?[\d\s()-]{6,}$/, "Įveskite telefono numerį."),
    email: z.union([z.literal(""), z.email("Neteisingas el. paštas.")]),
    guests: z.string().trim().regex(/^\d+$/, "Įveskite žmonių skaičių.").refine((v) => Number(v) >= 1, "Bent 1 žmogus."),
    price: z.string().trim().refine((v) => v === "" || /^\d+([.,]\d{1,2})?$/.test(v), "Suma arba tuščia."),
    note: z.string().trim().max(500),
  })
  .refine((v) => v.endDate >= v.date, { message: "Pabaiga negali būti prieš pradžią.", path: ["endDate"] })
  .refine((v) => v.endDate > v.date || v.endTime > v.startTime, { message: "Pabaiga turi būti vėlesnė už pradžią.", path: ["endTime"] });
type Values = z.infer<typeof schema>;

interface NewSpaceBookingDialogProps {
  onOpenChange: (open: boolean) => void;
  /** Prefilled first day, e.g. from the booking chooser. */
  date?: string;
}

/** Hires one or several event spaces for a day and time window to a customer, for the agreed price. */
export function NewSpaceBookingDialog({ onOpenChange, date = "" }: NewSpaceBookingDialogProps) {
  const { spaceBookings, createSpaceBooking } = useAdmin();
  const { register, control, handleSubmit, setError, setValue, getValues, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { date: date || todayKey(), endDate: date || todayKey(), startTime: "12:00", endTime: "18:00", spaces: [], name: "", surname: "", phone: "", email: "", guests: "", price: "", note: "" },
  });
  const err = formState.errors;
  const [day, endDay, startTime, endTime, spaces, guests, price] = useWatch({ control, name: ["date", "endDate", "startTime", "endTime", "spaces", "guests", "price"] });

  const taken = useMemo(() => {
    const ids = new Set<SpaceId>();
    const wanted = { date: day, endDate: endDay, startTime, endTime };
    if (!day || !endDay || `${endDay} ${endTime}` <= `${day} ${startTime}`) return ids;
    const clashing = spaceBookings.filter((b) => b.status !== "atsaukta" && windowsOverlap(wanted, b));
    for (const s of SPACES) if (anySpaceClash([s.id], clashing.flatMap((b) => b.spaces))) ids.add(s.id);
    return ids;
  }, [spaceBookings, day, endDay, startTime, endTime]);

  const suggested = suggestedSpacePrice(spaces, day, Number(guests) || 1);
  const total = price === "" ? suggested : Number(price.replace(",", "."));

  const submit = handleSubmit(async (v) => {
    if (v.spaces.some((id) => taken.has(id))) return setError("spaces", { message: "Kai kurios erdvės šiuo laiku jau užimtos." });
    const result = await createSpaceBooking({
      date: v.date,
      endDate: v.endDate,
      startTime: v.startTime,
      endTime: v.endTime,
      spaces: v.spaces,
      customer: { name: v.name, surname: v.surname, phone: v.phone, email: v.email },
      guests: Number(v.guests),
      price: total,
      status: "patvirtinta",
      note: v.note,
    });
    if ("error" in result) return setError("spaces", { message: result.error.message });
    toast.success(`Erdvės rezervuotos: ${spaceLabels(result.data.booking.spaces)}`);
    onOpenChange(false);
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Erdvių rezervacija</DialogTitle>
          <DialogDescription>Pasirinkite vieną ar kelias erdves, laiką ir kliento duomenis. Užimtos erdvės neaktyvios.</DialogDescription>
        </DialogHeader>
        <form id="new-space-booking" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <FormField id="sb-date" label="Nuo datos" error={err.date?.message}>
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <DatePicker
                  id="sb-date"
                  value={field.value}
                  invalid={!!err.date}
                  onChange={(v) => {
                    field.onChange(v);
                    if (getValues("endDate") < v) setValue("endDate", v, { shouldValidate: true });
                  }}
                />
              )}
            />
          </FormField>
          <FormField id="sb-start" label="Nuo laiko" error={err.startTime?.message}>
            <Input id="sb-start" type="time" aria-invalid={!!err.startTime} className="min-h-11" {...register("startTime")} />
          </FormField>
          <FormField id="sb-end-date" label="Iki datos" error={err.endDate?.message} hint="Kelių dienų nuomai pasirinkite vėlesnę datą.">
            <Controller control={control} name="endDate" render={({ field }) => <DatePicker id="sb-end-date" value={field.value} min={day} invalid={!!err.endDate} onChange={field.onChange} />} />
          </FormField>
          <FormField id="sb-end" label="Iki laiko" error={err.endTime?.message}>
            <Input id="sb-end" type="time" aria-invalid={!!err.endTime} className="min-h-11" {...register("endTime")} />
          </FormField>

          <div className="space-y-1.5 sm:col-span-2">
            <p className="text-sm font-medium">Erdvės</p>
            <Controller control={control} name="spaces" render={({ field }) => <SpacePicker value={field.value} onChange={field.onChange} taken={taken} invalid={!!err.spaces} />} />
            {err.spaces?.message ? <p className="text-xs text-destructive">{err.spaces.message}</p> : null}
          </div>

          <FormField id="sb-name" label="Vardas" error={err.name?.message}>
            <Input id="sb-name" autoComplete="given-name" aria-invalid={!!err.name} className="min-h-11" {...register("name")} />
          </FormField>
          <FormField id="sb-surname" label="Pavardė" error={err.surname?.message}>
            <Input id="sb-surname" autoComplete="family-name" aria-invalid={!!err.surname} className="min-h-11" {...register("surname")} />
          </FormField>
          <FormField id="sb-phone" label="Telefonas" error={err.phone?.message}>
            <FormPhoneInput<Values> name="phone" control={control} id="sb-phone" invalid={!!err.phone} />
          </FormField>
          <FormField id="sb-email" label="El. paštas (neprivaloma)" error={err.email?.message}>
            <Input id="sb-email" type="email" aria-invalid={!!err.email} className="min-h-11" {...register("email")} />
          </FormField>
          <FormField id="sb-guests" label="Žmonių" error={err.guests?.message}>
            <Input id="sb-guests" inputMode="numeric" aria-invalid={!!err.guests} className="min-h-11" {...register("guests")} />
          </FormField>
          <FormField id="sb-price" label="Kaina, €" error={err.price?.message} hint={`Pagal kainoraštį: ${formatEur(suggested)}. Palikite tuščią arba įveskite sutartą kainą.`}>
            <Input id="sb-price" inputMode="decimal" placeholder={String(suggested)} aria-invalid={!!err.price} className="min-h-11" {...register("price")} />
          </FormField>
          <FormField id="sb-note" label="Pastaba" className="sm:col-span-2">
            <Textarea id="sb-note" rows={2} {...register("note")} />
          </FormField>
        </form>
        <DialogFooter className="items-center justify-between *:flex-none">
          <p className="font-display text-total font-bold">{formatEur(Number.isFinite(total) ? total : 0)}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Atšaukti
            </Button>
            <Button type="submit" form="new-space-booking" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? "Kuriama…" : "Sukurti"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
