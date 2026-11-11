"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAdmin } from "../admin-store";
import { UPSELL_UNIT_LABEL, type Upsell, type UpsellUnit } from "@/lib/sauna-upsells";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const UNITS = Object.keys(UPSELL_UNIT_LABEL) as UpsellUnit[];

const schema = z.object({
  name: z.string().trim().min(2, "Įveskite pavadinimą.").max(40),
  description: z.string().trim().min(3, "Trumpai aprašykite.").max(80),
  price: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Įveskite kainą, pvz. 15."),
  unit: z.enum(UNITS as [UpsellUnit, ...UpsellUnit[]]),
  maxQty: z.string().trim().refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) >= 1), "Sveikas skaičius arba tuščia."),
  minHours: z.string().trim().refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 12), "Skaičius nuo 1 iki 12 arba tuščia."),
  active: z.boolean(),
});
type Values = z.infer<typeof schema>;

interface UpsellDialogProps {
  upsell?: Upsell;
  onOpenChange: (open: boolean) => void;
}

/** Create or edit an extra; remounted per item (key) so defaults reset. */
export function UpsellDialog({ upsell, onOpenChange }: UpsellDialogProps) {
  const { saveUpsell } = useAdmin();
  const { register, control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: upsell?.name ?? "",
      description: upsell?.description ?? "",
      price: upsell ? String(upsell.price) : "",
      unit: upsell?.unit ?? "rezervacijai",
      maxQty: upsell?.maxQty == null ? "" : String(upsell.maxQty),
      minHours: upsell?.minHours == null ? "" : String(upsell.minHours),
      active: upsell?.active ?? true,
    },
  });
  const unit = useWatch({ control, name: "unit" });
  const err = formState.errors;

  const submit = handleSubmit((v) => {
    saveUpsell({
      id: upsell?.id ?? `upsell-${crypto.randomUUID()}`,
      name: v.name,
      description: v.description,
      price: Number(v.price),
      unit: v.unit,
      maxQty: v.unit === "vienetui" && v.maxQty !== "" ? Number(v.maxQty) : null,
      minHours: v.minHours !== "" ? Number(v.minHours) : null,
      active: v.active,
    });
    toast.success(upsell ? "Paslauga atnaujinta" : "Paslauga pridėta");
    onOpenChange(false);
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{upsell ? "Redaguoti paslaugą" : "Nauja papildoma paslauga"}</DialogTitle>
          <DialogDescription>Rodoma žingsnyje „Papildomai“ tose pirtyse, kuriose ją įjungsite (pirties nustatymuose).</DialogDescription>
        </DialogHeader>
        <form id="upsell-form" onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="up-name">Pavadinimas</Label>
            <Input id="up-name" aria-invalid={!!err.name} {...register("name")} />
            {err.name ? <p className="text-xs text-destructive">{err.name.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="up-desc">Trumpas aprašymas</Label>
            <Input id="up-desc" aria-invalid={!!err.description} {...register("description")} />
            {err.description ? <p className="text-xs text-destructive">{err.description.message}</p> : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="up-price">Kaina, €</Label>
              <Input id="up-price" inputMode="decimal" aria-invalid={!!err.price} {...register("price")} />
              {err.price ? <p className="text-xs text-destructive">{err.price.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="up-unit">Kaina skaičiuojama</Label>
              <Controller
                control={control}
                name="unit"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="up-unit" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {UPSELL_UNIT_LABEL[u]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          {unit === "vienetui" ? (
            <div className="space-y-1.5">
              <Label htmlFor="up-max">Daugiausia vienetų</Label>
              <Input id="up-max" inputMode="numeric" placeholder="Pagal grupės dydį" aria-invalid={!!err.maxQty} {...register("maxQty")} />
              {err.maxQty ? <p className="text-xs text-destructive">{err.maxQty.message}</p> : null}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Klientas šią paslaugą tiesiog įjungia arba išjungia.</p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="up-min">Minimali seanso trukmė, val.</Label>
            <Input id="up-min" inputMode="numeric" placeholder="Nereikalaujama" aria-invalid={!!err.minHours} {...register("minHours")} />
            {err.minHours ? <p className="text-xs text-destructive">{err.minHours.message}</p> : <p className="text-xs text-muted-foreground">Pasirinkus šią paslaugą trumpesnių seansų pasirinkti nebus galima (pirtininkui – 3 val.).</p>}
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
          <Button type="submit" form="upsell-form">
            {upsell ? "Išsaugoti" : "Pridėti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
