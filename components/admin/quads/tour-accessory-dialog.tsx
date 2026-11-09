"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAdmin } from "../admin-store";
import type { QuadTourAccessory } from "@/lib/quads";
import { slugify } from "@/lib/sauna";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const schema = z.object({
  name: z.string().trim().min(1, "Įveskite pavadinimą.").max(60),
  description: z.string().trim().max(200, "Daugiausia 200 simbolių."),
  price: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Įveskite kainą, pvz. 5."),
  active: z.boolean(),
});
type Values = z.infer<typeof schema>;

/** Create or edit a piece of tour gear; remounted per item (key) so defaults reset. */
export function TourAccessoryDialog({ accessory, onOpenChange }: { accessory?: QuadTourAccessory; onOpenChange: (open: boolean) => void }) {
  const { quadTourAccessories, saveQuadTourAccessory } = useAdmin();
  const { register, control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: accessory?.name ?? "", description: accessory?.description ?? "", price: accessory ? String(accessory.price) : "", active: accessory?.active ?? true },
  });
  const err = formState.errors;

  const submit = handleSubmit((v) => {
    const taken = new Set(quadTourAccessories.map((a) => a.id));
    let id = accessory?.id ?? (slugify(v.name) || "priedas");
    for (let n = 2; !accessory && taken.has(id); n++) id = `${slugify(v.name) || "priedas"}-${n}`;
    saveQuadTourAccessory({
      id,
      name: v.name,
      description: v.description,
      price: Number(v.price),
      active: v.active,
      sortOrder: accessory?.sortOrder ?? Math.max(-1, ...quadTourAccessories.map((a) => a.sortOrder)) + 1,
    });
    toast.success(accessory ? "Priedas atnaujintas" : "Priedas pridėtas");
    onOpenChange(false);
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{accessory ? "Redaguoti priedą" : "Naujas priedas"}</DialogTitle>
          <DialogDescription>Papildoma įranga turo rezervacijoje. Kaina už vienetą su PVM.</DialogDescription>
        </DialogHeader>
        <form id="tour-accessory-form" onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ta-name">Pavadinimas</Label>
            <Input id="ta-name" aria-invalid={!!err.name} className="min-h-11" {...register("name")} />
            {err.name ? <p className="text-xs text-destructive">{err.name.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ta-price">Kaina, € / vnt.</Label>
            <Input id="ta-price" inputMode="decimal" aria-invalid={!!err.price} className="min-h-11" {...register("price")} />
            {err.price ? <p className="text-xs text-destructive">{err.price.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ta-description">Aprašymas</Label>
            <Input id="ta-description" aria-invalid={!!err.description} className="min-h-11" {...register("description")} />
            {err.description ? <p className="text-xs text-destructive">{err.description.message}</p> : null}
          </div>
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                Siūlyti rezervacijoje
              </label>
            )}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Atšaukti
          </Button>
          <Button type="submit" form="tour-accessory-form">
            {accessory ? "Išsaugoti" : "Pridėti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
