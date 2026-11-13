"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAdmin } from "../admin-store";
import { FormField } from "../form-field";
import { TourGearFields } from "./tour-gear-fields";
import { formatEur } from "@/lib/admin/format";
import { tourStartsOn } from "@/lib/admin/quad-availability";
import { hourLabel, MAX_QUAD_RENTAL_UNITS } from "@/lib/quads";
import { todayKey } from "@/lib/sauna";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Stepper } from "@/components/booking/stepper";
import { FormPhoneInput } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const schema = z
  .object({
    routeId: z.string().min(1, "Pasirinkite turą."),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pasirinkite datą.").refine((d) => d >= todayKey(), "Praėjusios dienos užsakyti negalima."),
    startHour: z.string().min(1, "Pasirinkite laiką."),
    units: z.string().regex(/^\d+$/, "Skaičius."),
    name: z.string().trim().min(2, "Įveskite vardą.").max(80),
    phone: z.string().trim().max(30),
    email: z.union([z.literal(""), z.email("Neteisingas el. paštas.")]),
    status: z.enum(["patvirtinta", "laukia"]),
    source: z.enum(["telefonu", "vietoje"]),
    note: z.string().trim().max(300),
  })
  .refine((v) => v.phone !== "" || v.email !== "", { message: "Nurodykite telefoną arba el. paštą.", path: ["phone"] });
type Values = z.infer<typeof schema>;

/**
 * A guided quad tour (Mini / Midi / Maxi) taken by phone or on site, with the website's rules: any start hour the free
 * fleet covers for the whole route, at least the route's minimum number of quads, optional gear. The database prices it.
 */
export function NewTourDialog({ onOpenChange, date, routeId }: { onOpenChange: (open: boolean) => void; date: string; routeId: string }) {
  const { quadTourRoutes, quadTourAccessories, quadTypes, quadSettings, quadRentals, createQuadTour } = useAdmin();
  const routes = quadTourRoutes.filter((r) => r.active);
  const [gear, setGear] = useState<Record<string, number>>({});
  const { register, control, handleSubmit, setValue, setError, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { routeId, date, startHour: "", units: String(routes.find((r) => r.id === routeId)?.minUnits ?? 1), name: "", phone: "", email: "", status: "patvirtinta", source: "telefonu", note: "" },
  });
  const [chosenRoute, day, startHour, unitsText] = useWatch({ control, name: ["routeId", "date", "startHour", "units"] });
  const err = formState.errors;
  const route = routes.find((r) => r.id === chosenRoute);
  const starts = route && day ? tourStartsOn(day, route, { types: quadTypes, settings: quadSettings, rentals: quadRentals }) : [];
  const free = starts.find((s) => String(s.hour) === startHour)?.free ?? 0;
  const units = Math.max(route?.minUnits ?? 1, Number(unitsText) || 0);
  const gearItems = quadTourAccessories.filter((a) => a.active && (gear[a.id] ?? 0) > 0);
  const total = route ? route.price * units + gearItems.reduce((sum, a) => sum + a.price * (gear[a.id] ?? 0), 0) : 0;

  const submit = handleSubmit(async (v) => {
    if (!route) return setError("routeId", { message: "Pasirinkite turą." });
    if (units < route.minUnits) return setError("units", { message: `Šiam turui reikia bent ${route.minUnits} keturračių.` });
    if (units > Math.min(free, MAX_QUAD_RENTAL_UNITS)) return setError("units", { message: `Šiuo laiku laisvų: ${free}.` });
    const result = await createQuadTour({
      routeId: v.routeId,
      date: v.date,
      startHour: Number(v.startHour),
      units,
      gear: gearItems.map((a) => ({ id: a.id, units: gear[a.id] })),
      customer: { name: v.name, phone: v.phone, email: v.email },
      status: v.status,
      source: v.source,
      note: v.note,
    });
    if ("error" in result) return setError("root", { message: result.error.message });
    toast.success(`Turas ${result.data.reference} sukurtas`);
    onOpenChange(false);
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Naujas keturračių turas</DialogTitle>
          <DialogDescription>Kaip svetainėje: laikai, kuriuos visam maršrutui dengia laisvi keturračiai, ir mažiausias keturračių skaičius.</DialogDescription>
        </DialogHeader>
        <form id="new-tour-form" onSubmit={submit} className="grid grid-cols-2 gap-3">
          <FormField id="nt-route" label="Turas" error={err.routeId?.message} className="col-span-2" hint={route ? `${route.kilometres} km · ${route.durationLabel} · nuo ${route.minUnits} keturračių · ${formatEur(route.price)} / keturratį` : undefined}>
            <Controller
              control={control}
              name="routeId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => { field.onChange(v); setValue("startHour", ""); setValue("units", String(routes.find((r) => r.id === v)?.minUnits ?? 1)); }}>
                  <SelectTrigger id="nt-route" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{routes.map((r) => <SelectItem key={r.id} value={r.id}>{r.name} turas</SelectItem>)}</SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField id="nt-date" label="Data" error={err.date?.message}>
            <Controller control={control} name="date" render={({ field }) => <DatePicker id="nt-date" value={field.value} min={todayKey()} invalid={!!err.date} onChange={(v) => { field.onChange(v); setValue("startHour", ""); }} />} />
          </FormField>
          <FormField id="nt-start" label="Pradžia" error={err.startHour?.message} hint={starts.length ? undefined : `Šią dieną nėra laiko, kai laisva bent ${route?.minUnits ?? 0} keturračių.`}>
            <Controller
              control={control}
              name="startHour"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!starts.length}>
                  <SelectTrigger id="nt-start" className="w-full" aria-invalid={!!err.startHour}><SelectValue placeholder="Laisvas laikas" /></SelectTrigger>
                  <SelectContent>{starts.map((s) => <SelectItem key={s.hour} value={String(s.hour)}>{hourLabel(s.hour)}–{hourLabel(s.hour + (route?.hours ?? 0))} · laisvų {s.free}</SelectItem>)}</SelectContent>
                </Select>
              )}
            />
          </FormField>
          <div className="col-span-2 space-y-1.5">
            <Stepper
              label="Keturračių"
              stacked
              value={units}
              min={route?.minUnits ?? 1}
              max={Math.max(route?.minUnits ?? 1, startHour ? Math.min(free, MAX_QUAD_RENTAL_UNITS) : MAX_QUAD_RENTAL_UNITS)}
              editable
              updateOnInput
              onChange={(n) => setValue("units", String(n), { shouldValidate: true })}
            />
            <p className={err.units ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
              {err.units?.message ?? (route ? `Nuo ${route.minUnits}${startHour ? ` iki ${Math.min(free, MAX_QUAD_RENTAL_UNITS)}` : ""}` : "")}
            </p>
          </div>
          <TourGearFields accessories={quadTourAccessories.filter((a) => a.active)} quantities={gear} onChange={(id, n) => setGear((g) => ({ ...g, [id]: n }))} maxTotal={units * 2} />
          <FormField id="nt-name" label="Klientas" error={err.name?.message} className="col-span-2">
            <Input id="nt-name" autoComplete="off" aria-invalid={!!err.name} className="min-h-11" {...register("name")} />
          </FormField>
          <FormField id="nt-phone" label="Telefonas" error={err.phone?.message}>
            <FormPhoneInput<Values> name="phone" control={control} id="nt-phone" invalid={!!err.phone} />
          </FormField>
          <FormField id="nt-email" label="El. paštas" error={err.email?.message}>
            <Input id="nt-email" type="email" aria-invalid={!!err.email} className="min-h-11" {...register("email")} />
          </FormField>
          {(["status", "source"] as const).map((name) => (
            <FormField key={name} id={`nt-${name}`} label={name === "status" ? "Būsena" : "Kaip užsakė"}>
              <Controller
                control={control}
                name={name}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={`nt-${name}`} className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(name === "status" ? [["patvirtinta", "Patvirtinta"], ["laukia", "Laukia"]] : [["telefonu", "Telefonu"], ["vietoje", "Vietoje"]]).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          ))}
          <FormField id="nt-note" label="Pastaba" className="col-span-2">
            <Textarea id="nt-note" rows={2} {...register("note")} />
          </FormField>
          {err.root?.message ? <p role="alert" className="col-span-2 text-xs text-destructive">{err.root.message}</p> : null}
        </form>
        <DialogFooter className="items-center justify-between *:flex-none">
          <p className="font-display text-total font-bold">{formatEur(total)}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Atšaukti</Button>
            <Button type="submit" form="new-tour-form" disabled={formState.isSubmitting}>{formState.isSubmitting ? "Kuriama…" : "Sukurti"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
