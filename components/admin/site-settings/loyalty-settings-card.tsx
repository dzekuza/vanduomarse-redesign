"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { DEFAULT_LOYALTY, earnedPoints, loyaltySettingsSchema, pointsValueEur, type LoyaltySettings } from "@/lib/points";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/** Owner-only: how many points a euro earns and what a point is worth at checkout (ADR-0121). */
export function LoyaltySettingsCard() {
  const { loadLoyaltySettings, saveLoyaltySettings } = useAdmin();
  const [loaded, setLoaded] = useState(false);
  const form = useForm<LoyaltySettings>({ resolver: zodResolver(loyaltySettingsSchema), defaultValues: DEFAULT_LOYALTY });

  useEffect(() => {
    let current = true;
    void loadLoyaltySettings().then((result) => {
      if (!current) return;
      if ("data" in result) form.reset(result.data);
      setLoaded(true);
    });
    return () => {
      current = false;
    };
  }, [loadLoyaltySettings, form]);

  const save = form.handleSubmit(async (values) => {
    const result = await saveLoyaltySettings(values);
    if ("data" in result) {
      toast.success("Taškų nustatymai išsaugoti");
      form.reset(result.data);
    }
  });

  const earn = useWatch({ control: form.control, name: "earnPointsPerEuro" });
  const value = useWatch({ control: form.control, name: "pointValueEur" });
  const enabled = useWatch({ control: form.control, name: "enabled" });
  const percent = Number.isFinite(earn) && Number.isFinite(value) ? Math.round(earn * value * 1000) / 10 : 0;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-item">Taškai (kreditai)</CardTitle>
        <CardDescription>
          Klientai gauna taškų už apmokėtus pirkinius internetu. Taškų panaudojimas atsiskaitant bus įjungtas vėliau; vertė žemiau jam jau paruošta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" noValidate onSubmit={save}>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="loyalty-enabled">Skirti taškus už pirkinius</Label>
            <Switch id="loyalty-enabled" checked={enabled} disabled={!loaded} onCheckedChange={(on) => form.setValue("enabled", on, { shouldDirty: true })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="loyalty-earn">Taškų už 1 €</Label>
              <Input id="loyalty-earn" type="number" step="any" min={0} className="min-h-11" disabled={!loaded} aria-invalid={Boolean(form.formState.errors.earnPointsPerEuro)} aria-describedby={form.formState.errors.earnPointsPerEuro ? "loyalty-earn-error" : undefined} {...form.register("earnPointsPerEuro", { valueAsNumber: true })} />
              {form.formState.errors.earnPointsPerEuro ? <p id="loyalty-earn-error" className="text-sm text-destructive">Įveskite skaičių nuo 0 iki 1000.</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loyalty-value">Vieno taško vertė, €</Label>
              <Input id="loyalty-value" type="number" step="any" min={0} className="min-h-11" disabled={!loaded} aria-invalid={Boolean(form.formState.errors.pointValueEur)} aria-describedby={form.formState.errors.pointValueEur ? "loyalty-value-error" : undefined} {...form.register("pointValueEur", { valueAsNumber: true })} />
              {form.formState.errors.pointValueEur ? <p id="loyalty-value-error" className="text-sm text-destructive">Įveskite skaičių didesnį už 0.</p> : null}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {!enabled
              ? "Taškai išjungti: už pirkinius jie neskiriami."
              : `Dabar: 100 € pirkinys duoda ${Number.isFinite(earn) ? earnedPoints(100, earn) : 0} tšk. (${Number.isFinite(earn) && Number.isFinite(value) ? pointsValueEur(earnedPoints(100, earn), value) : 0} € vertės, ${percent} %).`}
          </p>
          <Button type="submit" className="min-h-11" disabled={!loaded || form.formState.isSubmitting || !form.formState.isDirty}>
            Išsaugoti
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
