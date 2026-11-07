"use client";

import { CheckIcon, UserPlusIcon, XIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { RidePlanPicker } from "./ride-plan-picker";
import { RiderSelect } from "./rider-select";
import { ScanTarget } from "./scan-target";
import type { Rider } from "@/lib/admin/types";
import { formatPlanPrice } from "@/lib/ride-plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

/** A new guest is created with no details up front — staff fill in a real name later from their profile, if at all. Each gets a short random tag so cards stay distinguishable in the list. */
function guestIdentity() {
  return { name: "Svečias", surname: Math.random().toString(36).slice(2, 6).toUpperCase() };
}

/** One line of the sale: a plan plus (once assigned) the specific customer it was sold to. Each card gets its own customer — the same plan can go to several people in one session. */
interface CartItem {
  id: string;
  planId: string;
  status: "pending" | "sold";
  rider: Rider | null;
  cardNumber: string | null;
}

type Recipient = "rider" | "guest";
type ActiveDialog =
  | { phase: "pick"; item: CartItem }
  | { phase: "scan"; item: CartItem; rider: Rider }
  | { phase: "done"; item: CartItem; rider: Rider; cardNumber: string | null; replaced: Rider | null };

/** Sell plans at the till: add one or more plan cards, assign a customer to each (existing rider or new guest), then scan their bracelet to bind it. */
export function SalesTab() {
  const { riders, ridePlans, createRider, updateRiderPlan, bindRiderCard } = useAdmin();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [active, setActive] = useState<ActiveDialog | null>(null);
  const [recipient, setRecipient] = useState<Recipient>("rider");
  const [riderId, setRiderId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const counts = cart.reduce<Record<string, number>>((acc, item) => {
    acc[item.planId] = (acc[item.planId] ?? 0) + 1;
    return acc;
  }, {});

  const addPlan = (planId: string) => setCart((c) => [...c, { id: crypto.randomUUID(), planId, status: "pending", rider: null, cardNumber: null }]);
  const removeItem = (id: string) => setCart((c) => c.filter((i) => i.id !== id));

  const resetPickFields = () => {
    setRecipient("rider");
    setRiderId(null);
  };

  const openPick = (item: CartItem) => {
    resetPickFields();
    setActive({ phase: "pick", item });
  };

  const closeDialog = () => {
    setActive(null);
    resetPickFields();
  };

  function markSold(itemId: string, rider: Rider) {
    setCart((c) => c.map((i) => (i.id === itemId ? { ...i, status: "sold", rider } : i)));
  }

  async function assignExistingRider(item: CartItem, id: string) {
    setSaving(true);
    try {
      const result = await updateRiderPlan(id, item.planId);
      if ("error" in result) return;
      const rider = riders.find((r) => r.id === id);
      if (!rider) return;
      markSold(item.id, rider);
      setActive({ phase: "scan", item: { ...item, status: "sold", rider }, rider });
    } finally {
      setSaving(false);
    }
  }

  async function assignNewGuest(item: CartItem) {
    setSaving(true);
    try {
      const result = await createRider({ ...guestIdentity(), planId: item.planId });
      if ("error" in result) {
        toast.error(result.error.message);
        return;
      }
      const rider = result.data.rider;
      markSold(item.id, rider);
      setActive({ phase: "scan", item: { ...item, status: "sold", rider }, rider });
    } finally {
      setSaving(false);
    }
  }

  async function handleScan(cardNumber: string) {
    if (active?.phase !== "scan") return;
    setSaving(true);
    try {
      const result = await bindRiderCard(cardNumber, active.rider.id);
      if ("error" in result) return;
      setCart((c) => c.map((i) => (i.id === active.item.id ? { ...i, cardNumber } : i)));
      setActive({ phase: "done", item: active.item, rider: active.rider, cardNumber, replaced: result.data.replaced });
    } finally {
      setSaving(false);
    }
  }

  function handleSkipScan() {
    if (active?.phase !== "scan") return;
    setActive({ phase: "done", item: active.item, rider: active.rider, cardNumber: null, replaced: null });
  }

  const total = cart.reduce((sum, item) => sum + (ridePlans.find((p) => p.id === item.planId)?.price ?? 0), 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6">
      <div className="space-y-2">
        <Label>Planai</Label>
        <RidePlanPicker counts={counts} onAdd={addPlan} />
      </div>

      <Card className="lg:sticky lg:top-4">
        <CardHeader>
          <CardTitle>Krepšelis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {cart.length === 0 ? (
            <p className="rounded-lg bg-muted/50 px-2.5 py-2 text-sm text-muted-foreground">Pridėkite planą kairėje — kiekvienai kortelei priskirsite savo klientą.</p>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => {
                const plan = ridePlans.find((p) => p.id === item.planId);
                return (
                  <div key={item.id} className="space-y-1.5 rounded-lg border p-2.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-bold">{plan?.name ?? "—"}</span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="text-muted-foreground">{formatPlanPrice(plan?.price ?? null)}</span>
                        {item.status === "pending" ? (
                          <button
                            type="button"
                            aria-label="Pašalinti"
                            onClick={() => removeItem(item.id)}
                            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <XIcon size={14} />
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {item.status === "sold" && item.rider ? (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckIcon size={14} className="text-primary" />
                        {item.rider.name} {item.rider.surname}
                        {item.cardNumber ? <span className="font-mono text-foreground"> · {item.cardNumber}</span> : " · be apyrankės"}
                      </p>
                    ) : (
                      <Button type="button" size="sm" variant="outline" className="h-8 w-full" onClick={() => openPick(item)}>
                        <UserPlusIcon size={14} /> Priskirti klientui
                      </Button>
                    )}
                  </div>
                );
              })}
              <div className="flex items-center justify-between border-t pt-2 text-sm font-bold">
                <span>Iš viso</span>
                <span>{formatPlanPrice(total)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={active !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-sm">
          {active?.phase === "pick" ? (
            <>
              <DialogHeader>
                <DialogTitle>{ridePlans.find((p) => p.id === active.item.planId)?.name ?? "Planas"}</DialogTitle>
                <DialogDescription>Kam priskirti šį planą?</DialogDescription>
              </DialogHeader>
              <div className="inline-flex gap-1 rounded-lg bg-muted p-1">
                <Button type="button" size="sm" variant={recipient === "rider" ? "default" : "ghost"} className="min-h-9 flex-1" onClick={() => setRecipient("rider")}>
                  Esamas naudotojas
                </Button>
                <Button type="button" size="sm" variant={recipient === "guest" ? "default" : "ghost"} className="min-h-9 flex-1" onClick={() => setRecipient("guest")}>
                  Naujas svečias
                </Button>
              </div>
              {recipient === "rider" ? (
                riders.length > 0 ? (
                  <>
                    <RiderSelect
                      value={riderId}
                      onChange={(id) => {
                        setRiderId(id);
                        void assignExistingRider(active.item, id);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">Pasirinkus naudotoją atsidarys langas apyrankei nuskenuoti.</p>
                  </>
                ) : (
                  <p className="rounded-xl bg-secondary px-3 py-2 text-sm text-secondary-foreground">Naudotojų dar nėra — pasirinkite „Naujas svečias“.</p>
                )
              ) : (
                <div className="space-y-3">
                  <p className="rounded-xl bg-secondary px-3 py-2 text-sm text-secondary-foreground">
                    Be vardo ir pavardės — pridėsite juos vėliau naudotojo profilyje, jei reikės.
                  </p>
                  <Button className="min-h-10 w-full" disabled={saving} onClick={() => assignNewGuest(active.item)}>
                    Priskirti kaip naują svečią
                  </Button>
                </div>
              )}
            </>
          ) : null}

          {active?.phase === "scan" ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {active.rider.name} {active.rider.surname}
                </DialogTitle>
                <DialogDescription>{ridePlans.find((p) => p.id === active.item.planId)?.name ?? "Planas"} priskirtas — priglauskite apyrankę.</DialogDescription>
              </DialogHeader>
              <ScanTarget
                enabled={!saving}
                title="Priglauskite apyrankę"
                subtitle="Tai pakeis bet kurią ankstesnę šio naudotojo apyrankę"
                onScan={handleScan}
              />
              <Button variant="outline" disabled={saving} onClick={handleSkipScan}>
                Praleisti apyrankę
              </Button>
            </>
          ) : null}

          {active?.phase === "done" ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary">
                <CheckIcon size={36} className="text-primary-foreground" />
              </div>
              <p className="text-lg font-bold">Priskirta</p>
              <p className="text-sm text-muted-foreground">
                {active.rider.name} {active.rider.surname}
                {active.cardNumber ? (
                  <>
                    {" "}
                    → apyrankė <span className="font-mono text-foreground">{active.cardNumber}</span>
                  </>
                ) : null}
              </p>
              {active.replaced ? (
                <p className="text-sm text-destructive">
                  Perkelta nuo {active.replaced.name} {active.replaced.surname} — jie nebeturi apyrankės.
                </p>
              ) : null}
              <Button onClick={closeDialog}>Uždaryti</Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
