"use client";

import { IdentificationBadgeIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useAdmin } from "../admin-store";
import { PlanBadge } from "./plan-badge";
import { RiderAvatar } from "./rider-avatar";
import { ScanTarget } from "./scan-target";
import type { Rider } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/** Riders: name, plan, bracelet. Search, open a profile, rebind a bracelet. */
export function RidersTab() {
  const { riders, riderCards, bindRiderCard } = useAdmin();
  const [query, setQuery] = useState("");
  const [rebinding, setRebinding] = useState<Rider | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return riders.filter((r) => q === "" || `${r.name} ${r.surname}`.toLowerCase().includes(q));
  }, [riders, query]);

  if (rebinding) {
    return (
      <div className="flex flex-col items-center gap-6 py-6">
        <p className="text-center text-sm text-muted-foreground">
          Priglauskite apyrankę, kurią priskirti{" "}
          <span className="font-medium text-foreground">
            {rebinding.name} {rebinding.surname}
          </span>
          .
        </p>
        <ScanTarget
          enabled
          title="Priglauskite apyrankę"
          subtitle="Tai pakeis bet kurią ankstesnę šio naudotojo apyrankę"
          onScan={async (cardNumber) => {
            const result = await bindRiderCard(cardNumber, rebinding.id);
            setNotice(
              "data" in result && result.data.replaced
                ? `Apyrankė ${cardNumber} perkelta nuo ${result.data.replaced.name} ${result.data.replaced.surname}.`
                : null,
            );
            setRebinding(null);
          }}
        />
        <Button variant="outline" onClick={() => setRebinding(null)}>
          Atšaukti
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notice ? <p className="rounded-xl bg-secondary px-3 py-2 text-sm text-secondary-foreground">{notice}</p> : null}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "naudotojas" : "naudotojai"}
        </p>
        <Input placeholder="Paieška" value={query} onChange={(e) => setQuery(e.target.value)} className="min-h-11 w-56" />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <IdentificationBadgeIcon size={28} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-bold">Naudotojų nėra</p>
          <p className="text-sm text-muted-foreground">Priskirkite planą skiltyje „Pardavimas“.</p>
        </div>
      ) : (
        filtered.map((r) => {
          const card = riderCards.find((c) => c.riderId === r.id);
          return (
            <Card key={r.id}>
              <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <Link href={`/admin/apyrankes/${r.id}`} className="flex min-w-0 flex-1 basis-48 items-center gap-3">
                  <RiderAvatar name={r.name} surname={r.surname} avatarPath={r.avatarPath} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {r.name} {r.surname}
                    </p>
                    <PlanBadge planId={r.planId} />
                  </div>
                </Link>
                {card ? (
                  <span className="truncate font-mono text-xs text-muted-foreground">{card.cardNumber}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Nėra apyrankės</span>
                )}
                <Button variant="outline" size="sm" className="min-h-9" onClick={() => setRebinding(r)}>
                  {card ? "Pakeisti apyrankę" : "Priskirti apyrankę"}
                </Button>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
