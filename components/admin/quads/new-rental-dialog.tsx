"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAdmin } from "../admin-store";
import { hourLabel, rentalPrice } from "@/lib/quads";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const count = (min: number, max: number) => z.string().regex(/^\d+$/, "Skaičius.").refine((v) => Number(v) >= min && Number(v) <= max, `Nuo ${min} iki ${max}.`);

const schema = z
  .object({
    quadTypeId: z.string().min(1, "Pasirinkite tipą."),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pasirinkite datą."),
    startHour: count(0, 23),
    hours: count(1, 8),
    units: count(1, 20),
    riders: count(1, 40),
    name: z.string().trim().min(2, "Įveskite vardą.").max(80),
    phone: z.string().trim().max(30),
    email: z.union([z.literal(""), z.email("Neteisingas el. paštas.")]),
    status: z.enum(["patvirtinta", "laukia"]),
    source: z.enum(["telefonu", "vietoje"]),
    note: z.string().trim().max(300),
  })
  .refine((v) => v.phone !== "" || v.email !== "", { message: "Nurodykite telefoną arba el. paštą.", path: ["phone"] });
type Values = z.infer<typeof schema>;

/** A rental taken by phone or on site. The database refuses it when the hours are full. */
export function NewRentalDialog({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const { quadTypes, quadSettings: s, createRental } = useAdmin();
  const { register, control, handleSubmit, setError, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      quadTypeId: quadTypes[0]?.id ?? "",
      date: "",
      startHour: String(s.openHour),
      hours: "1",
      units: "1",
      riders: "1",
      name: "",
      phone: "",
      email: "",
      status: "patvirtinta",
      source: "telefonu",
      note: "",
    },
  });
  const err = formState.errors;
  const [typeId, hours, units] = useWatch({ control, name: ["quadTypeId", "hours", "units"] });
  const type = quadTypes.find((t) => t.id === typeId);
  const price = type && /^\d+$/.test(hours) && /^\d+$/.test(units) ? rentalPrice(type, Number(hours), Number(units)) : null;
  const startHours = Array.from({ length: s.closeHour - s.openHour }, (_, i) => s.openHour + i);

  const submit = handleSubmit(async (v) => {
    const result = await createRental({
      quadTypeId: v.quadTypeId,
      date: v.date,
      startHour: Number(v.startHour),
      hours: Number(v.hours),
      units: Number(v.units),
      riders: Number(v.riders),
      customer: { name: v.name, phone: v.phone, email: v.email },
      status: v.status,
      source: v.source,
      note: v.note,
    });
    if ("error" in result) return setError("root", { message: result.error.message });
    toast.success(`Nuoma ${result.data.reference} sukurta`);
    onOpenChange(false);
  });

  const select = (name: "quadTypeId" | "startHour" | "status" | "source", id: string, items: { value: string; label: string }[]) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((i) => (
              <SelectItem key={i.value} value={i.value}>
                {i.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nauja nuoma</DialogTitle>
          <DialogDescription>Telefonu ar vietoje priimta nuoma. Kaina skaičiuojama pagal parko kainas.</DialogDescription>
        </DialogHeader>
        <form id="new-rental-form" onSubmit={submit} className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="nr-type">Keturratis</Label>
            {select("quadTypeId", "nr-type", quadTypes.map((t) => ({ value: t.id, label: `${t.name} (${t.pricePerHour} €/val.)` })))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nr-date">Data</Label>
            <Input id="nr-date" type="date" aria-invalid={!!err.date} className="min-h-11" {...register("date")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nr-start">Pradžia</Label>
            {select("startHour", "nr-start", startHours.map((h) => ({ value: String(h), label: hourLabel(h) })))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nr-hours">Valandų</Label>
            <Input id="nr-hours" inputMode="numeric" aria-invalid={!!err.hours} className="min-h-11" {...register("hours")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nr-units">Keturračių</Label>
            <Input id="nr-units" inputMode="numeric" aria-invalid={!!err.units} className="min-h-11" {...register("units")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nr-riders">Važiuotojų</Label>
            <Input id="nr-riders" inputMode="numeric" aria-invalid={!!err.riders} className="min-h-11" {...register("riders")} />
          </div>
          <p className="self-end pb-2 text-right font-display text-lg font-bold">{price === null ? "" : `${price} €`}</p>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="nr-name">Klientas</Label>
            <Input id="nr-name" aria-invalid={!!err.name} className="min-h-11" {...register("name")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nr-phone">Telefonas</Label>
            <Input id="nr-phone" type="tel" aria-invalid={!!err.phone} className="min-h-11" {...register("phone")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nr-email">El. paštas</Label>
            <Input id="nr-email" type="email" aria-invalid={!!err.email} className="min-h-11" {...register("email")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nr-status">Būsena</Label>
            {select("status", "nr-status", [{ value: "patvirtinta", label: "Patvirtinta" }, { value: "laukia", label: "Laukia" }])}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nr-source">Šaltinis</Label>
            {select("source", "nr-source", [{ value: "telefonu", label: "Telefonu" }, { value: "vietoje", label: "Vietoje" }])}
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="nr-note">Pastaba</Label>
            <Textarea id="nr-note" rows={2} {...register("note")} />
          </div>
          {Object.values(err).some((e) => e && "message" in e && e.message) ? (
            <p role="alert" className="col-span-2 text-xs text-destructive">
              {err.root?.message ?? Object.values(err).map((e) => e?.message).find(Boolean)}
            </p>
          ) : null}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Atšaukti
          </Button>
          <Button type="submit" form="new-rental-form" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? "Kuriama..." : "Sukurti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
