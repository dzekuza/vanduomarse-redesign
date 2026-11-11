"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAdmin } from "../admin-store";
import type { SaunaMaster } from "@/lib/sauna-masters";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/** Form values are strings (inputs); converted to a `SaunaMaster` on submit. */
const schema = z.object({
  name: z.string().trim().min(2, "Įveskite vardą.").max(60, "Daugiausia 60 simbolių."),
  description: z.string().trim().max(240, "Daugiausia 240 simbolių."),
  price: z.string().trim().regex(/^\d+([.,]\d{1,2})?$/, "Įveskite kainą, pvz. 250."),
  minHours: z.string().trim().regex(/^\d+$/, "Sveikas skaičius.").refine((v) => Number(v) >= 1 && Number(v) <= 12, "Nuo 1 iki 12 val."),
  active: z.boolean(),
});
type Values = z.infer<typeof schema>;

interface MasterDialogProps {
  master?: SaunaMaster;
  /** Sort order for a new pirtininkas: after the existing ones. */
  nextOrder: number;
  onOpenChange: (open: boolean) => void;
}

/** Create or edit a pirtininkas; remounted per item (key) so defaults reset. */
export function MasterDialog({ master, nextOrder, onOpenChange }: MasterDialogProps) {
  const { saveSaunaMaster } = useAdmin();
  const { register, control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: master?.name ?? "",
      description: master?.description ?? "",
      price: master ? String(master.price) : "",
      minHours: master ? String(master.minHours) : "3",
      active: master?.active ?? true,
    },
  });
  const err = formState.errors;

  const submit = handleSubmit((v) => {
    saveSaunaMaster({
      id: master?.id ?? `pirtininkas-${crypto.randomUUID()}`,
      name: v.name,
      description: v.description,
      price: Number(v.price.replace(",", ".")),
      minHours: Number(v.minHours),
      active: v.active,
      sortOrder: master?.sortOrder ?? nextOrder,
    });
    toast.success(master ? "Pirtininkas atnaujintas" : "Pirtininkas pridėtas");
    onOpenChange(false);
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{master ? "Redaguoti pirtininką" : "Naujas pirtininkas"}</DialogTitle>
          <DialogDescription>Klientas jį gali pridėti prie privačios pirties ir programų: kaina pridedama prie užsakymo.</DialogDescription>
        </DialogHeader>
        <form id="master-form" onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ma-name">Vardas</Label>
            <Input id="ma-name" aria-invalid={!!err.name} {...register("name")} />
            {err.name ? <p className="text-xs text-destructive">{err.name.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ma-desc">Trumpas aprašymas</Label>
            <Input id="ma-desc" aria-invalid={!!err.description} {...register("description")} />
            {err.description ? <p className="text-xs text-destructive">{err.description.message}</p> : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ma-price">Kaina už rezervaciją, €</Label>
              <Input id="ma-price" inputMode="decimal" aria-invalid={!!err.price} {...register("price")} />
              {err.price ? <p className="text-xs text-destructive">{err.price.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ma-min">Min. trukmė pagal valandas, val.</Label>
              <Input id="ma-min" inputMode="numeric" aria-invalid={!!err.minHours} {...register("minHours")} />
              {err.minHours ? <p className="text-xs text-destructive">{err.minHours.message}</p> : null}
            </div>
          </div>
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                Rodyti rezervacijoje
              </label>
            )}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Atšaukti
          </Button>
          <Button type="submit" form="master-form">
            {master ? "Išsaugoti" : "Pridėti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
