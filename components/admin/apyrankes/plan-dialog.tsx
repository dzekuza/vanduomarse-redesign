"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAdmin } from "../admin-store";
import type { RidePlan, RidePlanCategory } from "@/lib/admin/types";
import { RIDE_PLAN_CATEGORIES } from "@/lib/ride-plans";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const schema = z.object({
  name: z.string().trim().min(1, "Įveskite pavadinimą.").max(60),
  description: z.string().trim().max(200),
  price: z.string().trim(),
  category: z.enum(RIDE_PLAN_CATEGORIES),
  active: z.boolean(),
  soldOnline: z.boolean(),
});
type Values = z.infer<typeof schema>;

interface PlanDialogProps {
  plan?: RidePlan;
  /** Category tab a new plan is created from; ignored when editing. */
  defaultCategory: RidePlanCategory;
  onOpenChange: (open: boolean) => void;
}

/** Create or edit a ride plan; remounted per plan (key) so defaults reset. */
export function PlanDialog({ plan, defaultCategory, onOpenChange }: PlanDialogProps) {
  const { ridePlans, saveRidePlan } = useAdmin();
  const [free, setFree] = useState(plan ? plan.price === null : false);
  const { register, control, handleSubmit, setError, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: plan?.name ?? "",
      description: plan?.description ?? "",
      price: plan?.price != null ? String(plan.price) : "",
      category: plan?.category ?? defaultCategory,
      active: plan?.active ?? true,
      soldOnline: plan?.soldOnline ?? false,
    },
  });
  const err = formState.errors;

  const submit = handleSubmit(async (v) => {
    if (!free && !/^\d+(\.\d{1,2})?$/.test(v.price)) {
      setError("price", { message: "Įveskite kainą, pvz. 35." });
      return;
    }
    const result = await saveRidePlan({
      id: plan?.id ?? "",
      name: v.name,
      description: v.description,
      price: free ? null : Number(v.price),
      category: v.category,
      active: v.active,
      soldOnline: !free && v.soldOnline,
      sortOrder: plan?.sortOrder ?? ridePlans.filter((p) => p.category === v.category).length,
    });
    if ("error" in result) return;
    toast.success(plan ? "Planas atnaujintas" : "Planas pridėtas");
    onOpenChange(false);
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{plan ? "Redaguoti planą" : "Naujas planas"}</DialogTitle>
          <DialogDescription>Rodomas skiltyje „Pardavimas“, kai priskiriamas naudotojui.</DialogDescription>
        </DialogHeader>
        <form id="ride-plan-form" onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="plan-name">Pavadinimas</Label>
            <Input id="plan-name" aria-invalid={!!err.name} {...register("name")} />
            {err.name ? <p className="text-xs text-destructive">{err.name.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-desc">Aprašymas</Label>
            <Input id="plan-desc" {...register("description")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-category">Kategorija</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => field.onChange(v as RidePlanCategory)}>
                  <SelectTrigger id="plan-category" className="min-h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RIDE_PLAN_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <Switch checked={free} onCheckedChange={setFree} />
            Nemokamas (be mokesčio, pvz. darbuotojams)
          </label>
          {!free ? (
            <div className="space-y-1.5">
              <Label htmlFor="plan-price">Kaina (€)</Label>
              <Input id="plan-price" inputMode="decimal" aria-invalid={!!err.price} {...register("price")} />
              {err.price ? <p className="text-xs text-destructive">{err.price.message}</p> : null}
            </div>
          ) : null}
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                Rodomas pardavimo sąraše
              </label>
            )}
          />
          <Controller
            control={control}
            name="soldOnline"
            render={({ field }) => (
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <Switch checked={field.value && !free} disabled={free} onCheckedChange={field.onChange} />
                <span>
                  Parduodamas internetu
                  <span className="block text-xs text-muted-foreground">Rodomas svetainėje (Wake): pirkėjas užsiregistruoja ir apmoka kortele. Reikia kainos.</span>
                </span>
              </label>
            )}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Atšaukti
          </Button>
          <Button type="submit" form="ride-plan-form">
            {plan ? "Išsaugoti" : "Pridėti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
