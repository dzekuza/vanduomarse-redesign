"use client";

import { WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useAdmin } from "../admin-store";
import { ScanTarget } from "./scan-target";
import { formatPlanPrice } from "@/lib/ride-plans";
import { Button } from "@/components/ui/button";

interface ScanResult {
  cardNumber: string;
  riderName: string | null;
  planName: string | null;
  planPrice: number | null;
}

/** Tap a bracelet, resolve it to a rider + plan. Pure lookup against data already in the store. */
export function ScanTab() {
  const { riderCards, riders, ridePlans } = useAdmin();
  const [result, setResult] = useState<ScanResult | null>(null);

  function resolve(cardNumber: string) {
    const binding = riderCards.find((c) => c.cardNumber === cardNumber);
    const rider = binding ? riders.find((r) => r.id === binding.riderId) ?? null : null;
    const plan = rider ? ridePlans.find((p) => p.id === rider.planId) ?? null : null;
    setResult({
      cardNumber,
      riderName: rider ? `${rider.name} ${rider.surname}` : null,
      planName: plan?.name ?? null,
      planPrice: plan?.price ?? null,
    });
  }

  if (result) {
    return (
      <div className="flex flex-col items-center gap-5 py-6 text-center">
        {result.riderName ? (
          <>
            <p className="text-lg font-bold">{result.riderName}</p>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">{result.planName}</span>
            <p className="text-sm text-muted-foreground">{formatPlanPrice(result.planPrice)}</p>
          </>
        ) : (
          <>
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <WarningCircleIcon size={36} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-bold">Nežinoma apyrankė</p>
            <p className="text-sm text-muted-foreground">
              Apyrankė nepriskirta jokiam naudotojui. Priskirkite ją skiltyje „Pardavimas“.
            </p>
          </>
        )}
        <p className="font-mono text-xs text-muted-foreground">apyrankė {result.cardNumber}</p>
        <Button variant="outline" onClick={() => setResult(null)}>
          <XIcon size={18} /> Skenuoti kitą
        </Button>
      </div>
    );
  }

  return <ScanTarget enabled title="Pasiruošta skenuoti" subtitle="Priglauskite apyrankę prie skaitytuvo" onScan={resolve} />;
}
