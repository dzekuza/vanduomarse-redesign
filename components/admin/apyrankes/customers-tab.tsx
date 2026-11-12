"use client";

import { useMemo, useState } from "react";
import { useAdmin } from "../admin-store";
import { CustomersTable, type CustomerRow } from "./customers-table";
import { RebindBracelet } from "./rebind-bracelet";
import type { Purchase, Rider } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FILTERS = [
  { id: "all", label: "Visi" },
  { id: "active", label: "Aktyvūs planai" },
  { id: "subscription", label: "Abonementai" },
] as const;
type Filter = (typeof FILTERS)[number]["id"];

/** Customers of /admin/apyrankes: everyone with a current plan or a bracelet-plan purchase, with what they bought. */
export function CustomersTab() {
  const { riders, purchases, ridePlans, riderCards } = useAdmin();
  const [rebinding, setRebinding] = useState<Rider | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const rows = useMemo<CustomerRow[]>(() => {
    const byRider = new Map<string, Purchase[]>();
    for (const p of purchases) byRider.set(p.riderId, [...(byRider.get(p.riderId) ?? []), p]);
    const subscriptionPlanIds = new Set(ridePlans.filter((p) => p.category === "Abonementai").map((p) => p.id));

    return riders
      .flatMap((rider) => {
        const bought = byRider.get(rider.id) ?? [];
        if (bought.length === 0 && !rider.planId) return [];
        return [
          {
            rider,
            purchases: bought,
            spent: bought.reduce((sum, p) => sum + (p.price ?? 0), 0),
            lastSoldAt: bought.reduce<string | null>((last, p) => (!last || p.soldAt > last ? p.soldAt : last), null),
            hasSubscription: bought.some((p) => p.planCategory === "Abonementai") || (!!rider.planId && subscriptionPlanIds.has(rider.planId)),
          },
        ];
      })
      .toSorted((a, b) => (b.lastSoldAt ?? b.rider.createdAt).localeCompare(a.lastSoldAt ?? a.rider.createdAt));
  }, [riders, purchases, ridePlans]);

  const cardRiderIds = useMemo(() => new Set(riderCards.map((c) => c.riderId)), [riderCards]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(({ rider, hasSubscription }) => {
      if (filter === "active" && !rider.planId) return false;
      if (filter === "subscription" && !hasSubscription) return false;
      return q === "" || `${rider.name} ${rider.surname}`.toLowerCase().includes(q) || (rider.phone ?? "").includes(q) || (rider.email ?? "").toLowerCase().includes(q);
    });
  }, [rows, filter, query]);

  if (rebinding) {
    return (
      <RebindBracelet
        rider={rebinding}
        onDone={(message) => {
          setNotice(message);
          setRebinding(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {notice ? <p className="rounded-xl bg-secondary px-3 py-2 text-sm text-secondary-foreground">{notice}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Button key={f.id} type="button" size="sm" variant={filter === f.id ? "default" : "outline"} className="min-h-11" onClick={() => setFilter(f.id)}>
              {f.label}
            </Button>
          ))}
        </div>
        <Input placeholder="Paieška" value={query} onChange={(e) => setQuery(e.target.value)} className="min-h-11 w-full sm:w-56" />
      </div>
      <p className="text-sm text-muted-foreground">
        {shown.length} {shown.length === 1 ? "klientas" : "klientai"}
      </p>

      {shown.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Klientų nėra.</p>
      ) : (
        <CustomersTable rows={shown} cardRiderIds={cardRiderIds} onAssign={setRebinding} />
      )}
    </div>
  );
}
