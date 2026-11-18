"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAdmin } from "../admin-store";
import { formatDateTime } from "@/lib/admin/format";
import type { Rider } from "@/lib/admin/types";
import { MAX_ADJUST_POINTS, formatPoints, kindLabel, type PointsEntry } from "@/lib/points";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Staff type a positive amount and pick give or take; the sign is applied when it is sent. */
const formSchema = z.object({
  amount: z.number("Įveskite taškų skaičių.").int("Taškai turi būti sveikas skaičius.").min(1, "Įveskite bent 1 tašką.").max(MAX_ADJUST_POINTS, "Per didelė suma."),
  reason: z.string().trim().min(1, "Nurodykite priežastį.").max(200, "Per ilga priežastis."),
});
type FormValues = z.infer<typeof formSchema>;

/** `/admin/klientai/[id]` → Taškai: the balance, give or take points with a reason, and the log of every movement. */
export function CustomerPointsTab({ rider }: { rider: Rider }) {
  const { adjustRiderPoints, loadRiderPoints } = useAdmin();
  const [entries, setEntries] = useState<PointsEntry[] | null>(null);
  const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: { amount: undefined, reason: "" } });

  // The log loads when the tab opens (and again after each change); it is not part of the admin data.
  useEffect(() => {
    let current = true;
    void loadRiderPoints(rider.id).then((result) => {
      if (current && "data" in result) setEntries(result.data);
    });
    return () => {
      current = false;
    };
  }, [loadRiderPoints, rider.id]);

  const submit = (sign: 1 | -1) =>
    form.handleSubmit(async ({ amount, reason }) => {
      const result = await adjustRiderPoints(rider.id, sign * amount, reason);
      if (!("data" in result)) return;
      toast.success(sign > 0 ? "Taškai pridėti" : "Taškai nuskaičiuoti");
      form.reset({ amount: undefined, reason: "" });
      const latest = await loadRiderPoints(rider.id);
      if ("data" in latest) setEntries(latest.data);
    });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-item">Likutis: {formatPoints(rider.pointsBalance)}</CardTitle>
          <CardDescription>Taškus klientas gauna už apmokėtus pirkinius internetu, o čia juos galima pridėti ar nuskaičiuoti ranka. Kiekvienas pakeitimas išsaugomas žurnale.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="points-amount">Taškų skaičius</Label>
              <Input id="points-amount" type="number" inputMode="numeric" min={1} className="min-h-11" aria-invalid={Boolean(form.formState.errors.amount)} {...form.register("amount", { valueAsNumber: true })} />
              {form.formState.errors.amount ? <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="points-reason">Priežastis</Label>
              <Input id="points-reason" className="min-h-11" maxLength={200} aria-invalid={Boolean(form.formState.errors.reason)} {...form.register("reason")} />
              {form.formState.errors.reason ? <p className="text-sm text-destructive">{form.formState.errors.reason.message}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" className="min-h-11" disabled={form.formState.isSubmitting} onClick={submit(1)}>
                Pridėti taškus
              </Button>
              <Button type="button" variant="outline" className="min-h-11" disabled={form.formState.isSubmitting} onClick={submit(-1)}>
                Nuskaičiuoti
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-item">Žurnalas</CardTitle>
        </CardHeader>
        <CardContent>
          {entries === null ? (
            <p className="text-sm text-muted-foreground">Kraunama…</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Judėjimų dar nėra.</p>
          ) : (
            <ul className="divide-y">
              {entries.map((entry, i) => (
                <li key={`${entry.at}-${i}`} className="flex items-start justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{kindLabel(entry.kind)}</p>
                    {entry.reason ? <p className="text-muted-foreground">{entry.reason}</p> : null}
                    <p className="text-xs text-muted-foreground">{formatDateTime(entry.at)}</p>
                  </div>
                  <span className={entry.delta > 0 ? "shrink-0 font-bold tabular-nums" : "shrink-0 font-bold tabular-nums text-destructive"}>
                    {entry.delta > 0 ? "+" : ""}
                    {entry.delta}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
