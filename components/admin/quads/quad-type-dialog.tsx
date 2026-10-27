"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAdmin } from "../admin-store";
import type { QuadType } from "@/lib/quads";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const schema = z.object({
  name: z.string().trim().min(2, "Įveskite pavadinimą.").max(60),
  description: z.string().trim().max(200),
  seats: z.enum(["1", "2"]),
  units: z.string().trim().regex(/^\d+$/, "Sveikas skaičius.").refine((v) => Number(v) <= 100, "Daugiausia 100."),
  price: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Įveskite kainą, pvz. 30."),
  active: z.boolean(),
});
type Values = z.infer<typeof schema>;

interface QuadTypeDialogProps {
  quadType?: QuadType;
  onOpenChange: (open: boolean) => void;
}

/** Create or edit a quad type; remounted per type (key) so defaults reset. */
export function QuadTypeDialog({ quadType, onOpenChange }: QuadTypeDialogProps) {
  const { saveQuadType } = useAdmin();
  const { register, control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: quadType?.name ?? "",
      description: quadType?.description ?? "",
      seats: quadType ? (String(quadType.seats) as "1" | "2") : "1",
      units: quadType ? String(quadType.units) : "1",
      price: quadType ? String(quadType.pricePerHour) : "",
      active: quadType?.active ?? true,
    },
  });
  const err = formState.errors;

  const submit = handleSubmit((v) => {
    saveQuadType({
      id: quadType?.id ?? `keturratis-${crypto.randomUUID().slice(0, 8)}`,
      name: v.name,
      description: v.description,
      seats: Number(v.seats),
      units: Number(v.units),
      pricePerHour: Number(v.price),
      active: v.active,
    });
    toast.success(quadType ? "Keturratis atnaujintas" : "Keturratis pridėtas");
    onOpenChange(false);
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{quadType ? "Redaguoti keturratį" : "Naujas keturračio tipas"}</DialogTitle>
          <DialogDescription>Rodomas /keturraciai nuomos žingsnyje „Keturratis ir važiuotojai“.</DialogDescription>
        </DialogHeader>
        <form id="quad-type-form" onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="qt-name">Pavadinimas</Label>
            <Input id="qt-name" aria-invalid={!!err.name} {...register("name")} />
            {err.name ? <p className="text-xs text-destructive">{err.name.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qt-desc">Aprašymas</Label>
            <Input id="qt-desc" {...register("description")} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="qt-seats">Vietų</Label>
              <Controller
                control={control}
                name="seats"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="qt-seats" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qt-units">Kiekis</Label>
              <Input id="qt-units" inputMode="numeric" aria-invalid={!!err.units} {...register("units")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qt-price">€ / val.</Label>
              <Input id="qt-price" inputMode="decimal" aria-invalid={!!err.price} {...register("price")} />
            </div>
          </div>
          {err.units || err.price ? <p className="text-xs text-destructive">{err.units?.message ?? err.price?.message}</p> : null}
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                Nuomoti svetainėje
              </label>
            )}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Atšaukti
          </Button>
          <Button type="submit" form="quad-type-form">
            {quadType ? "Išsaugoti" : "Pridėti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
