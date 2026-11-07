"use client";

import { CheckIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { RidePlanPicker } from "./ride-plan-picker";
import { RiderSelect } from "./rider-select";
import { ScanTarget } from "./scan-target";
import type { Rider } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Recipient = "rider" | "guest";
type Step = { kind: "form" } | { kind: "bind"; rider: Rider } | { kind: "done"; rider: Rider; cardNumber: string; replaced: Rider | null };

/** Sell a plan to an existing rider or a new guest, then bind their bracelet. */
export function SalesTab() {
  const { riders, ridePlans, createRider, updateRiderPlan, bindRiderCard } = useAdmin();
  const firstPlanId = ridePlans.find((p) => p.active)?.id ?? "";

  const [planId, setPlanId] = useState(firstPlanId);
  const [recipient, setRecipient] = useState<Recipient>(riders.length > 0 ? "rider" : "guest");
  const [riderId, setRiderId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestSurname, setGuestSurname] = useState("");
  const [step, setStep] = useState<Step>({ kind: "form" });
  const [saving, setSaving] = useState(false);

  const canSubmit = Boolean(planId) && (recipient === "rider" ? riderId !== null : guestName.trim().length > 0 && guestSurname.trim().length > 0);

  const resetForm = () => {
    setRiderId(null);
    setGuestName("");
    setGuestSurname("");
    setStep({ kind: "form" });
  };

  async function handleSell() {
    if (!canSubmit) return;
    setSaving(true);
    try {
      if (recipient === "rider" && riderId) {
        const result = await updateRiderPlan(riderId, planId);
        if ("error" in result) return;
        const rider = riders.find((r) => r.id === riderId);
        if (rider) setStep({ kind: "bind", rider: { ...rider, planId } });
      } else {
        const result = await createRider({ name: guestName, surname: guestSurname, planId });
        if ("error" in result) {
          toast.error(result.error.message);
          return;
        }
        setStep({ kind: "bind", rider: result.data.rider });
      }
    } finally {
      setSaving(false);
    }
  }

  if (step.kind === "bind") {
    return (
      <div className="flex flex-col items-center gap-6">
        <p className="text-center text-sm text-muted-foreground">
          Planas priskirtas — dabar priglauskite apyrankę <span className="font-medium text-foreground">{step.rider.name} {step.rider.surname}</span>.
        </p>
        <ScanTarget
          enabled
          title="Priglauskite apyrankę"
          subtitle="Tai pakeis bet kurią ankstesnę šio naudotojo apyrankę"
          onScan={async (cardNumber) => {
            const result = await bindRiderCard(cardNumber, step.rider.id);
            if ("data" in result) setStep({ kind: "done", rider: step.rider, cardNumber, replaced: result.data.replaced });
          }}
        />
        <Button variant="outline" onClick={resetForm}>
          Praleisti
        </Button>
      </div>
    );
  }

  if (step.kind === "done") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary">
          <CheckIcon size={36} className="text-primary-foreground" />
        </div>
        <p className="text-lg font-bold">Pardavimas atliktas</p>
        <p className="text-sm text-muted-foreground">
          {step.rider.name} {step.rider.surname} → apyrankė <span className="font-mono text-foreground">{step.cardNumber}</span>
        </p>
        {step.replaced ? (
          <p className="text-sm text-destructive">
            Perkelta nuo {step.replaced.name} {step.replaced.surname} — jie nebeturi apyrankės.
          </p>
        ) : null}
        <Button onClick={resetForm}>Naujas pardavimas</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-2">
        <Label>Planas</Label>
        <RidePlanPicker value={planId} onChange={setPlanId} />
      </div>

      <div className="space-y-2">
        <Label>Priskirti</Label>
        <div className="inline-flex gap-1 rounded-lg bg-muted p-1">
          <Button type="button" size="sm" variant={recipient === "rider" ? "default" : "ghost"} className="min-h-9" onClick={() => setRecipient("rider")}>
            Esamas naudotojas
          </Button>
          <Button type="button" size="sm" variant={recipient === "guest" ? "default" : "ghost"} className="min-h-9" onClick={() => setRecipient("guest")}>
            Naujas svečias
          </Button>
        </div>
      </div>

      {recipient === "rider" ? (
        riders.length > 0 ? (
          <RiderSelect value={riderId} onChange={setRiderId} />
        ) : (
          <p className="rounded-xl bg-secondary px-3 py-2 text-sm text-secondary-foreground">Naudotojų dar nėra — pasirinkite „Naujas svečias“, kad sukurtumėte pirmą.</p>
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="guest-name">Vardas</Label>
            <Input id="guest-name" placeholder="Jonas" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="guest-surname">Pavardė</Label>
            <Input id="guest-surname" placeholder="Jonaitis" value={guestSurname} onChange={(e) => setGuestSurname(e.target.value)} />
          </div>
        </div>
      )}

      <Button className="mt-1 min-h-11 w-full" disabled={!canSubmit || saving} onClick={handleSell}>
        Priskirti planą
      </Button>
    </div>
  );
}
