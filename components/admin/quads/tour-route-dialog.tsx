"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAdmin } from "../admin-store";
import type { QuadTourRoute } from "@/lib/quads";
import { slugify } from "@/lib/sauna";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const int = (min: number, max: number) =>
  z.string().trim().regex(/^\d+$/, "Sveikas skaičius.").refine((v) => Number(v) >= min && Number(v) <= max, `Nuo ${min} iki ${max}.`);

const optionalInt = (min: number, max: number) =>
  z.string().trim().regex(/^\d*$/, "Sveikas skaičius.").refine((v) => v === "" || (Number(v) >= min && Number(v) <= max), `Nuo ${min} iki ${max} arba tuščia.`);
const orNull = (v: string) => (v === "" ? null : Number(v));

const schema = z.object({
  name: z.string().trim().min(1, "Įveskite pavadinimą.").max(60),
  kilometres: int(1, 500),
  hours: int(1, 8),
  durationLabel: z.string().trim().max(30, "Daugiausia 30 simbolių."),
  price: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Įveskite kainą, pvz. 79."),
  minUnits: int(1, 40),
  maxUnits: int(1, 40),
  groupFrom: optionalInt(2, 40),
  groupPrice: z.string().trim().regex(/^(\d+(\.\d{1,2})?)?$/, "Įveskite kainą, pvz. 72."),
  guidesFrom: optionalInt(2, 40),
  guideUnits: int(0, 5),
  description: z.string().trim().max(200, "Daugiausia 200 simbolių."),
  longDescription: z.string().trim().max(1200, "Daugiausia 1200 simbolių."),
  photo: z.string().trim().max(200).regex(/^(\/[A-Za-z0-9._/-]*)?$/, "Kelias prasideda /, pvz. /quads/ciongo/mini-route.webp."),
  badge: z.string().trim().max(20, "Daugiausia 20 simbolių."),
  active: z.boolean(),
})
  .refine((v) => Number(v.minUnits) <= Number(v.maxUnits), { path: ["maxUnits"], message: "Ne mažiau nei mažiausias kiekis." })
  .refine((v) => (v.groupFrom === "") === (v.groupPrice === ""), { path: ["groupPrice"], message: "Užpildykite abu grupės laukus arba nė vieno." });
type Values = z.infer<typeof schema>;

/** Create or edit a tour product; remounted per route (key) so defaults reset. */
export function TourRouteDialog({ route, onOpenChange }: { route?: QuadTourRoute; onOpenChange: (open: boolean) => void }) {
  const { quadTourRoutes, saveQuadTourRoute } = useAdmin();
  const { register, control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: route?.name ?? "",
      kilometres: route ? String(route.kilometres) : "",
      hours: route ? String(route.hours) : "1",
      durationLabel: route?.durationLabel ?? "",
      price: route ? String(route.price) : "",
      minUnits: route ? String(route.minUnits) : "3",
      maxUnits: route ? String(route.maxUnits) : "15",
      groupFrom: route?.groupFrom != null ? String(route.groupFrom) : "",
      groupPrice: route?.groupPrice != null ? String(route.groupPrice) : "",
      guidesFrom: route?.guidesFrom != null ? String(route.guidesFrom) : "",
      guideUnits: route ? String(route.guideUnits) : "0",
      description: route?.description ?? "",
      longDescription: route?.longDescription ?? "",
      photo: route?.photo ?? "",
      badge: route?.badge ?? "",
      active: route?.active ?? true,
    },
  });
  const err = formState.errors;

  const submit = handleSubmit((v) => {
    const taken = new Set(quadTourRoutes.map((r) => r.id));
    let id = route?.id ?? (slugify(v.name) || "turas");
    for (let n = 2; !route && taken.has(id); n++) id = `${slugify(v.name) || "turas"}-${n}`;
    saveQuadTourRoute({
      id,
      name: v.name,
      kilometres: Number(v.kilometres),
      hours: Number(v.hours),
      durationLabel: v.durationLabel,
      price: Number(v.price),
      minUnits: Number(v.minUnits),
      maxUnits: Number(v.maxUnits),
      groupFrom: orNull(v.groupFrom),
      groupPrice: orNull(v.groupPrice),
      guidesFrom: orNull(v.guidesFrom),
      guideUnits: Number(v.guideUnits),
      description: v.description,
      longDescription: v.longDescription,
      photo: v.photo,
      badge: v.badge || null,
      active: v.active,
      sortOrder: route?.sortOrder ?? Math.max(-1, ...quadTourRoutes.map((r) => r.sortOrder)) + 1,
    });
    toast.success(route ? "Turas atnaujintas" : "Turas pridėtas");
    onOpenChange(false);
  });

  const field = (id: keyof Values, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`tr-${id}`}>{label}</Label>
      <Input id={`tr-${id}`} aria-invalid={!!err[id]} className="min-h-11" {...props} {...register(id as "name")} />
      {err[id] ? <p className="text-xs text-destructive">{err[id]?.message}</p> : null}
    </div>
  );

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{route ? "Redaguoti turą" : "Naujas turas"}</DialogTitle>
          <DialogDescription>Kaina yra už keturratį su PVM. Vedlių keturračiai imami iš to paties parko papildomai prie klientų. Rezervacijos kainą visada perskaičiuoja duomenų bazė iš šių reikšmių.</DialogDescription>
        </DialogHeader>
        <form id="tour-route-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{field("name", "Pavadinimas")}</div>
          {field("price", "Kaina, € už keturratį", { inputMode: "decimal" })}
          {field("minUnits", "Mažiausiai keturračių", { inputMode: "numeric" })}
          {field("maxUnits", "Daugiausiai keturračių klientams", { inputMode: "numeric" })}
          {field("groupFrom", "Grupės kaina nuo, keturr.", { inputMode: "numeric", placeholder: "10" })}
          {field("groupPrice", "Grupės kaina, € už keturratį", { inputMode: "decimal", placeholder: "72" })}
          {field("guidesFrom", "Vedliai nuo, keturr.", { inputMode: "numeric", placeholder: "11" })}
          {field("guideUnits", "Keturračių vedliams", { inputMode: "numeric" })}
          {field("kilometres", "Atstumas, km", { inputMode: "numeric" })}
          {field("hours", "Trukmė, val.", { inputMode: "numeric" })}
          {field("durationLabel", "Trukmė kortelėje", { placeholder: "Iki 2 val." })}
          {field("badge", "Ženklelis", { placeholder: "Populiariausia" })}
          <div className="sm:col-span-2">{field("description", "Trumpas aprašymas")}</div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="tr-longDescription">Ilgas aprašymas</Label>
            <Textarea id="tr-longDescription" rows={4} aria-invalid={!!err.longDescription} {...register("longDescription")} />
            {err.longDescription ? <p className="text-xs text-destructive">{err.longDescription.message}</p> : null}
          </div>
          <div className="sm:col-span-2">{field("photo", "Nuotraukos kelias", { placeholder: "/quads/ciongo/mini-route.webp" })}</div>
          <Controller
            control={control}
            name="active"
            render={({ field: f }) => (
              <label className="flex min-h-11 items-center gap-3 text-sm sm:col-span-2">
                <Switch checked={f.value} onCheckedChange={f.onChange} />
                Rodyti ir priimti rezervacijas
              </label>
            )}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Atšaukti
          </Button>
          <Button type="submit" form="tour-route-form">
            {route ? "Išsaugoti" : "Pridėti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
