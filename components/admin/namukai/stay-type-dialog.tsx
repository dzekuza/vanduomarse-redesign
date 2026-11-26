"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { StaySeasonsFields } from "./stay-seasons-fields";
import { seasonToValues, stayTypeSchema, toNumber, valuesToSeason, type StayTypeValues } from "./stay-type-schema";
import { STAY_KIND_LABEL, newStayTypeId, type StayKind, type StayType } from "@/lib/cabin";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const PRICE_TIERS = [
  { name: "price", id: "st-price", label: "1 naktis" },
  { name: "price2", id: "st-price-2", label: "2 naktys" },
  { name: "price3", id: "st-price-3", label: "3 ir daugiau" },
] as const;

interface StayTypeDialogProps {
  kind: StayKind;
  stayType?: StayType;
  onOpenChange: (open: boolean) => void;
}

/** Create or edit a cabin size or camper pitch; remounted per type (key) so defaults reset. */
export function StayTypeDialog({ kind, stayType, onOpenChange }: StayTypeDialogProps) {
  const { stayTypes, saveStayType } = useAdmin();
  const { register, control, handleSubmit, setError, formState } = useForm<StayTypeValues>({
    resolver: zodResolver(stayTypeSchema),
    defaultValues: {
      label: stayType?.label ?? "",
      note: stayType?.note ?? "",
      maxGuests: String(stayType?.maxGuests ?? (kind === "namelis" ? 2 : 6)),
      units: stayType ? (stayType.units === null ? "" : String(stayType.units)) : kind === "namelis" ? "1" : "",
      price: stayType ? String(stayType.pricePerNight) : "",
      price2: stayType ? String(stayType.pricePerNight2) : "",
      price3: stayType ? String(stayType.pricePerNight3) : "",
      seasons: stayType?.seasons.map(seasonToValues) ?? [],
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
      pricePerNight: toNumber(v.price),
      pricePerNight2: toNumber(v.price2),
      pricePerNight3: toNumber(v.price3),
      seasons: v.seasons.map(valuesToSeason),
      units: v.units === "" ? null : Number(v.units),
      active: v.active,
      sortOrder: stayType?.sortOrder ?? Math.max(-1, ...stayTypes.map((t) => t.sortOrder)) + 1,
    });
    toast.success(stayType ? "Tipas atnaujintas" : "Tipas pridėtas");
    onOpenChange(false);
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="st-guests">Svečių</Label>
              <Input id="st-guests" inputMode="numeric" aria-invalid={!!err.maxGuests} {...register("maxGuests")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-units">{kind === "namelis" ? "Kiekis" : "Vietų"}</Label>
              <Input id="st-units" inputMode="numeric" placeholder={kind === "kemperis" ? "neribota" : ""} aria-invalid={!!err.units} {...register("units")} />
            </div>
          </div>
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">Kaina € už naktį</legend>
            <div className="grid grid-cols-3 gap-3">
              {PRICE_TIERS.map(({ name, id, label }) => (
                <div key={name} className="space-y-1.5">
                  <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">{label}</Label>
                  <Input id={id} inputMode="decimal" aria-invalid={!!err[name]} {...register(name)} />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Visoms nakvynės naktims taikoma jos ilgio kaina, pvz. 100 / 80 / 60: 4 naktys = 4 × 60 €.</p>
          </fieldset>
          <StaySeasonsFields control={control} register={register} errors={err} />
          {err.maxGuests || err.units || err.price || err.price2 || err.price3 ? (
            <p className="text-xs text-destructive">{err.maxGuests?.message ?? err.units?.message ?? err.price?.message ?? err.price2?.message ?? err.price3?.message}</p>
          ) : null}
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
