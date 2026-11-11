"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAdmin } from "../admin-store";
import { STAY_KIND_LABEL, newStayTypeId, type StayKind, type StayType } from "@/lib/cabin";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const schema = z.object({
  label: z.string().trim().min(2, "Įveskite pavadinimą.").max(60),
  note: z.string().trim().max(120),
  maxGuests: z.string().trim().regex(/^\d+$/, "Sveikas skaičius.").refine((v) => Number(v) >= 1 && Number(v) <= 30, "Nuo 1 iki 30."),
  units: z.string().trim().refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 500), "Nuo 1 iki 500."),
  price: z.string().trim().regex(/^\d+([.,]\d{1,2})?$/, "Įveskite kainą, pvz. 50."),
  active: z.boolean(),
});
type Values = z.infer<typeof schema>;

interface StayTypeDialogProps {
  kind: StayKind;
  stayType?: StayType;
  onOpenChange: (open: boolean) => void;
}

/** Create or edit a cabin size or camper pitch; remounted per type (key) so defaults reset. */
export function StayTypeDialog({ kind, stayType, onOpenChange }: StayTypeDialogProps) {
  const { stayTypes, saveStayType } = useAdmin();
  const { register, control, handleSubmit, setError, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: stayType?.label ?? "",
      note: stayType?.note ?? "",
      maxGuests: String(stayType?.maxGuests ?? (kind === "namelis" ? 2 : 6)),
      units: stayType ? (stayType.units === null ? "" : String(stayType.units)) : kind === "namelis" ? "1" : "",
      price: stayType ? String(stayType.pricePerNight) : "",
      active: stayType?.active ?? true,
    },
  });
  const err = formState.errors;

  const submit = handleSubmit((v) => {
    // Cabins are always counted; only camper pitches may be unlimited.
    if (kind === "namelis" && v.units === "") return setError("units", { message: "Įveskite namelių skaičių." });
    saveStayType({
      id: stayType?.id ?? newStayTypeId(kind),
      kind,
      label: v.label,
      note: v.note,
      maxGuests: Number(v.maxGuests),
      pricePerNight: Number(v.price.replace(",", ".")),
      units: v.units === "" ? null : Number(v.units),
      active: v.active,
      sortOrder: stayType?.sortOrder ?? Math.max(-1, ...stayTypes.map((t) => t.sortOrder)) + 1,
    });
    toast.success(stayType ? "Tipas atnaujintas" : "Tipas pridėtas");
    onOpenChange(false);
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{stayType ? `Redaguoti: ${stayType.label}` : `Naujas tipas: ${STAY_KIND_LABEL[kind].toLowerCase()}`}</DialogTitle>
          <DialogDescription>Rodomas /rezervacija nakvynės žingsnyje ir kainų sąraše. Kaina su PVM, už vieną vienetą per naktį.</DialogDescription>
        </DialogHeader>
        <form id="stay-type-form" onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="st-label">Pavadinimas</Label>
            <Input id="st-label" aria-invalid={!!err.label} {...register("label")} />
            {err.label ? <p className="text-xs text-destructive">{err.label.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-note">Pastaba (nebūtina)</Label>
            <Input id="st-note" placeholder={kind === "kemperis" ? "su elektra" : ""} {...register("note")} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="st-guests">Svečių</Label>
              <Input id="st-guests" inputMode="numeric" aria-invalid={!!err.maxGuests} {...register("maxGuests")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-units">{kind === "namelis" ? "Kiekis" : "Vietų"}</Label>
              <Input id="st-units" inputMode="numeric" placeholder={kind === "kemperis" ? "neribota" : ""} aria-invalid={!!err.units} {...register("units")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-price">€ / naktį</Label>
              <Input id="st-price" inputMode="decimal" aria-invalid={!!err.price} {...register("price")} />
            </div>
          </div>
          {err.maxGuests || err.units || err.price ? <p className="text-xs text-destructive">{err.maxGuests?.message ?? err.units?.message ?? err.price?.message}</p> : null}
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                Rodyti svetainėje
              </label>
            )}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Atšaukti
          </Button>
          <Button type="submit" form="stay-type-form">
            {stayType ? "Išsaugoti" : "Pridėti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
