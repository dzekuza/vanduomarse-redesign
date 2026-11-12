"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAdmin } from "../admin-store";
import { PlanBadge } from "./plan-badge";
import { RiderAvatar } from "./rider-avatar";
import { ScanTarget } from "./scan-target";
import { formatDay, formatEur } from "@/lib/admin/format";
import type { Purchase, Rider } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const FILTERS = [
  { id: "all", label: "Visi" },
  { id: "active", label: "Aktyvūs planai" },
  { id: "subscription", label: "Abonementai" },
] as const;
type Filter = (typeof FILTERS)[number]["id"];

interface CustomerRow {
  rider: Rider;
  purchases: Purchase[];
  spent: number;
  lastSoldAt: string | null;
  hasSubscription: boolean;
}

/** Customers of /admin/apyrankes: everyone with a current plan or a bracelet-plan purchase, with what they bought. */
export function CustomersTab() {
  const { riders, purchases, ridePlans, riderCards, bindRiderCard } = useAdmin();
  const router = useRouter();
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
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Klientas</TableHead>
                <TableHead className="hidden sm:table-cell">Dabartinis planas</TableHead>
                <TableHead className="hidden md:table-cell">Pirkimai</TableHead>
                <TableHead className="hidden lg:table-cell">Apyrankė</TableHead>
                <TableHead className="text-right">Suma</TableHead>
                <TableHead className="pr-4 text-right">
                  <span className="sr-only">Veiksmai</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map(({ rider, purchases: bought, spent, lastSoldAt }) => (
                <TableRow key={rider.id} className="cursor-pointer" onClick={() => router.push(`/admin/klientai/${rider.id}`)}>
                  <TableCell className="pl-4">
                    <Link href={`/admin/klientai/${rider.id}`} onClick={(e) => e.stopPropagation()} className="flex min-h-11 min-w-0 items-center gap-3 outline-none focus-visible:ring-3 focus-visible:ring-ring">
                      <RiderAvatar name={rider.name} surname={rider.surname} avatarPath={rider.avatarPath} />
                      <span className="min-w-0">
                        <span className="block truncate font-bold">
                          {rider.name} {rider.surname}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">{rider.phone || rider.email || "Nėra kontaktų"}</span>
                        <PlanBadge planId={rider.planId} className="mt-1 sm:hidden" />
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <PlanBadge planId={rider.planId} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {bought.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <>
                        <span className="block">{bought.length}</span>
                        {lastSoldAt ? <span className="block text-xs text-muted-foreground">paskutinis {formatDay(lastSoldAt.slice(0, 10))}</span> : null}
                      </>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{cardRiderIds.has(rider.id) ? "Priskirta" : <span className="text-xs text-muted-foreground">Nėra</span>}</TableCell>
                  <TableCell className="text-right font-display text-sm font-bold tabular-nums">{formatEur(spent)}</TableCell>
                  <TableCell className="pr-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-11"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRebinding(rider);
                      }}
                    >
                      {cardRiderIds.has(rider.id) ? "Pakeisti apyrankę" : "Priskirti apyrankę"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
