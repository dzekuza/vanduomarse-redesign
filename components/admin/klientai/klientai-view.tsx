"use client";

import { AddressBookIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { PlanBadge } from "../apyrankes/plan-badge";
import { RiderAvatar } from "../apyrankes/rider-avatar";
import { ScanTarget } from "../apyrankes/scan-target";
import type { Rider } from "@/lib/admin/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 25;

const ACTIVITY_FILTERS = [
  { id: "apyrankes", label: "Apyrankės" },
  { id: "namukai", label: "Namukai" },
  { id: "keturraciai", label: "Keturračiai" },
] as const;
type ActivityFilter = (typeof ACTIVITY_FILTERS)[number]["id"];

const isActivityFilter = (value: string): value is ActivityFilter => (ACTIVITY_FILTERS as readonly { id: string }[]).some((f) => f.id === value);

/** `/admin/klientai`: every customer (riders, incl. bulk-imported Grabby contacts). Search, paginate, open a profile. ADR-0042 */
export function KlientaiView() {
  const { riders, riderCards, purchases, bookings, quadRentals, eventTickets, coupons, bindRiderCard } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  // Pre-filtered from a domain page's "Žr. klientus" link (`?activity=`, ADR-0045), comma-separated for more than one.
  const [activityFilters, setActivityFilters] = useState<ActivityFilter[]>(() =>
    (searchParams.get("activity")?.split(",") ?? []).filter(isActivityFilter),
  );
  const [rebinding, setRebinding] = useState<Rider | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const activityRiders = useMemo(() => {
    const apyrankes = new Set(purchases.map((p) => p.riderId));
    const namukai = new Set(bookings.filter((b) => b.kind === "namelis" && b.riderId).map((b) => b.riderId!));
    const keturraciai = new Set(quadRentals.filter((q) => q.riderId).map((q) => q.riderId!));
    return { apyrankes, namukai, keturraciai } satisfies Record<ActivityFilter, Set<string>>;
  }, [purchases, bookings, quadRentals]);

  function toggleActivityFilter(id: ActivityFilter) {
    const next = activityFilters.includes(id) ? activityFilters.filter((f) => f !== id) : [...activityFilters, id];
    setActivityFilters(next);
    setPage(1);
    const params = new URLSearchParams(searchParams);
    if (next.length) params.set("activity", next.join(","));
    else params.delete("activity");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const lastActivity = useMemo(() => {
    const byRider = new Map<string, string>();
    const bump = (riderId: string | undefined, at: string) => {
      if (!riderId) return;
      const prev = byRider.get(riderId);
      if (!prev || at > prev) byRider.set(riderId, at);
    };
    for (const p of purchases) bump(p.riderId, p.soldAt);
    for (const b of bookings) bump(b.riderId, b.createdAt);
    for (const q of quadRentals) bump(q.riderId, q.createdAt);
    for (const t of eventTickets) bump(t.riderId, t.createdAt);
    for (const c of coupons) bump(c.riderId, c.createdAt);
    return byRider;
  }, [purchases, bookings, quadRentals, eventTickets, coupons]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = riders.filter((r) => {
      const matchesQuery =
        q === "" || `${r.name} ${r.surname}`.toLowerCase().includes(q) || (r.phone ?? "").includes(q) || (r.email ?? "").toLowerCase().includes(q);
      const matchesActivity = activityFilters.length === 0 || activityFilters.some((f) => activityRiders[f].has(r.id));
      return matchesQuery && matchesActivity;
    });
    return rows.toSorted((a, b) => (lastActivity.get(b.id) ?? b.createdAt).localeCompare(lastActivity.get(a.id) ?? a.createdAt));
  }, [riders, query, lastActivity, activityFilters, activityRiders]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Clamp rather than reset on every filtered-length change: a page past the end (e.g. after a search) just snaps back to the last one.
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (rebinding) {
    return (
      <AdminPage title="Klientai" description="Visi klientai: kontaktai, rezervacijos, pirkimai, dokumentai ir komentarai.">
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
      </AdminPage>
    );
  }

  return (
    <AdminPage title="Klientai" description="Visi klientai: kontaktai, rezervacijos, pirkimai, dokumentai ir komentarai.">
      {notice ? <p className="rounded-xl bg-secondary px-3 py-2 text-sm text-secondary-foreground">{notice}</p> : null}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "klientas" : "klientai"}
        </p>
        <Input
          placeholder="Paieška"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          className="min-h-11 w-56"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {ACTIVITY_FILTERS.map((f) => (
          <Button
            key={f.id}
            type="button"
            size="sm"
            variant={activityFilters.includes(f.id) ? "default" : "outline"}
            className="min-h-9"
            onClick={() => toggleActivityFilter(f.id)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <AddressBookIcon size={28} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-bold">Klientų nėra</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paged.map((r) => {
              const card = riderCards.find((c) => c.riderId === r.id);
              return (
                <Card key={r.id}>
                  <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-3">
                    <Link href={`/admin/klientai/${r.id}`} className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                      <RiderAvatar name={r.name} surname={r.surname} avatarPath={r.avatarPath} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">
                          {r.name} {r.surname}
                          {r.selfRegistered ? <Badge variant="outline" className="ml-1.5 align-middle">Internetu</Badge> : null}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{r.phone || r.email || "Nėra kontaktų"}</p>
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
            })}
          </div>

          {pageCount > 1 ? (
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                size="icon"
                className="min-h-11 min-w-11"
                aria-label="Ankstesnis puslapis"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <CaretLeftIcon size={18} />
              </Button>
              <p className="text-sm text-muted-foreground">
                {currentPage} / {pageCount}
              </p>
              <Button
                variant="outline"
                size="icon"
                className="min-h-11 min-w-11"
                aria-label="Kitas puslapis"
                disabled={currentPage >= pageCount}
                onClick={() => setPage((p) => p + 1)}
              >
                <CaretRightIcon size={18} />
              </Button>
            </div>
          ) : null}
        </>
      )}
    </AdminPage>
  );
}
