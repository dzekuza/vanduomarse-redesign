"use client";

import Link from "next/link";
import { useState } from "react";
import { useAdmin } from "../admin-store";
import { RiderSelect } from "./rider-select";
import { formatEur } from "@/lib/admin/format";
import type { PlanPass } from "@/lib/admin/types";
import { formatPassCode } from "@/lib/plan-pass";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface RedeemPassDialogProps {
  pass: PlanPass | null;
  onClose: (message?: string) => void;
}

/**
 * Attach a paid pass to a customer at the park (ADR-0109). The customer must have finished /registracija (photo and signed
 * rules): that is the gate before a bracelet. A customer who already has a plan is only changed when staff tick the box.
 */
export function RedeemPassDialog({ pass, onClose }: RedeemPassDialogProps) {
  const { riders, riderWaivers, ridePlans, redeemPlanPass } = useAdmin();
  const [riderId, setRiderId] = useState<string | null>(null);
  const [replace, setReplace] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rider = riders.find((r) => r.id === riderId) ?? null;
  const registered = rider ? !!rider.avatarPath && riderWaivers.some((w) => w.riderId === rider.id && !!w.signaturePath) : false;
  const currentPlan = rider?.planId ? (ridePlans.find((p) => p.id === rider.planId)?.name ?? "planą") : null;
  const canSubmit = !!pass && !!rider && registered && (!currentPlan || replace) && !busy;

  function close(message?: string) {
    setRiderId(null);
    setReplace(false);
    setError(null);
    onClose(message);
  }

  async function submit() {
    if (!pass || !rider) return;
    setBusy(true);
    setError(null);
    const result = await redeemPlanPass(pass.id, rider.id, replace);
    setBusy(false);
    if ("error" in result) {
      setError(result.error.message);
      return;
    }
    close(`${pass.planName} priskirtas: ${rider.name} ${rider.surname}. Dabar galite priskirti apyrankę.`);
  }

  return (
    <Dialog open={pass !== null} onOpenChange={(open) => (open ? undefined : close())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Priskirti abonementą</DialogTitle>
          <DialogDescription>
            {pass ? `${pass.planName} · ${formatEur(pass.price)} · kodas ${pass.code ? formatPassCode(pass.code) : ""}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RiderSelect value={riderId} onChange={(id) => { setRiderId(id); setReplace(false); setError(null); }} label="Klientas, kuriam priskiriamas abonementas" />

          {rider && !registered ? (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {rider.name} dar neužbaigė registracijos (nuotrauka ir pasirašytos taisyklės). Paprašykite užsiregistruoti per /registracija, tada pasirinkite jį čia.{" "}
              <Link href={`/admin/klientai/${rider.id}`} className="underline underline-offset-4">
                Atidaryti klientą
              </Link>
            </p>
          ) : null}

          {rider && registered && currentPlan ? (
            <div className="flex items-start gap-3 rounded-lg bg-muted px-3 py-2">
              <Checkbox id="replace-plan" checked={replace} onCheckedChange={(v) => setReplace(v === true)} className="mt-0.5" />
              <Label htmlFor="replace-plan" className="text-sm font-normal">
                {rider.name} jau turi planą „{currentPlan}“. Pakeisti jį šiuo abonementu.
              </Label>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" className="min-h-11" onClick={() => close()}>
            Atšaukti
          </Button>
          <Button type="button" className="min-h-11" disabled={!canSubmit} onClick={() => void submit()}>
            {busy ? "Priskiriama..." : "Priskirti abonementą"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
