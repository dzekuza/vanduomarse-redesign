"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAdmin } from "../admin-store";
import { FormField } from "../form-field";
import type { ManagedEventPreset } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const count = (min: number) => z.string().trim().regex(/^\d+$/, "Skaičius.").refine((v) => Number(v) >= min, `Bent ${min}.`);
const money = z.string().trim().regex(/^\d+([.,]\d{1,2})?$/, "Suma.");
const num = (v: string) => Number(v.replace(",", "."));

const schema = z
  .object({
    label: z.string().trim().min(2, "Įveskite pavadinimą.").max(60),
    adults: count(1),
    kids: count(0),
    min: money,
    max: money,
    active: z.boolean(),
  })
  .refine((v) => num(v.max) >= num(v.min), { message: "Viršutinė riba mažesnė už apatinę.", path: ["max"] });
type Values = z.infer<typeof schema>;

interface EventPresetDialogProps {
  /** Null creates a new type. */
  preset: ManagedEventPreset | null;
  nextOrder: number;
  onOpenChange: (open: boolean) => void;
}

/** Name, typical group size and typical price per guest of one event type. */
export function EventPresetDialog({ preset, nextOrder, onOpenChange }: EventPresetDialogProps) {
  const { saveEventPreset } = useAdmin();
  const { register, control, handleSubmit, setError, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: preset?.label ?? "",
      adults: String(preset?.adults ?? 20),
      kids: String(preset?.kids ?? 0),
      min: String(preset?.perGuest.min ?? ""),
      max: String(preset?.perGuest.max ?? ""),
      active: preset?.active ?? true,
    },
  });
  const err = formState.errors;

  const submit = handleSubmit(async (v) => {
    const result = await saveEventPreset({
      id: preset?.id ?? null,
      label: v.label,
      perGuestMin: num(v.min),
      perGuestMax: num(v.max),
      adults: Number(v.adults),
      kids: Number(v.kids),
      active: v.active,
      sortOrder: preset?.sortOrder ?? nextOrder,
    });
    if ("error" in result) return setError("label", { message: result.error.message });
    toast.success(preset ? "Renginio tipas išsaugotas" : "Renginio tipas pridėtas");
    onOpenChange(false);
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{preset ? "Redaguoti renginio tipą" : "Naujas renginio tipas"}</DialogTitle>
          <DialogDescription>Rodomas skaičiuoklėje. Svečių skaičius – tai, ką pasirinkus tipą pasiūlome klientui.</DialogDescription>
        </DialogHeader>
        <form id="event-preset" onSubmit={submit} className="grid grid-cols-2 gap-3">
          <FormField id="ep-label" label="Pavadinimas" error={err.label?.message} className="col-span-2">
            <Input id="ep-label" aria-invalid={!!err.label} className="min-h-11" {...register("label")} />
          </FormField>
          <FormField id="ep-adults" label="Suaugusių" error={err.adults?.message}>
            <Input id="ep-adults" inputMode="numeric" aria-invalid={!!err.adults} className="min-h-11" {...register("adults")} />
          </FormField>
          <FormField id="ep-kids" label="Vaikų" error={err.kids?.message}>
            <Input id="ep-kids" inputMode="numeric" aria-invalid={!!err.kids} className="min-h-11" {...register("kids")} />
          </FormField>
          <FormField id="ep-min" label="Kaina asm. nuo, €" error={err.min?.message}>
            <Input id="ep-min" inputMode="decimal" aria-invalid={!!err.min} className="min-h-11" {...register("min")} />
          </FormField>
          <FormField id="ep-max" label="Kaina asm. iki, €" error={err.max?.message}>
            <Input id="ep-max" inputMode="decimal" aria-invalid={!!err.max} className="min-h-11" {...register("max")} />
          </FormField>
          <div className="col-span-2 flex min-h-11 items-center justify-between gap-3">
            <label htmlFor="ep-active" className="text-sm font-medium">
              Rodyti skaičiuoklėje
            </label>
            <Controller control={control} name="active" render={({ field }) => <Switch id="ep-active" checked={field.value} onCheckedChange={field.onChange} />} />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Atšaukti
          </Button>
          <Button type="submit" form="event-preset" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? "Saugoma…" : "Išsaugoti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
