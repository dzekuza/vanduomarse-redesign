"use client";

import { AddressBookIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { RiderAvatar } from "../apyrankes/rider-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 25;

/** `/admin/klientai`: every customer (riders, incl. bulk-imported Grabby contacts). Search, paginate, open a profile. ADR-0042 */
export function KlientaiView() {
  const { riders, purchases, bookings, quadRentals, eventTickets, coupons } = useAdmin();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

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
    const rows = riders.filter(
      (r) => q === "" || `${r.name} ${r.surname}`.toLowerCase().includes(q) || (r.phone ?? "").includes(q) || (r.email ?? "").toLowerCase().includes(q),
    );
    return rows.toSorted((a, b) => (lastActivity.get(b.id) ?? b.createdAt).localeCompare(lastActivity.get(a.id) ?? a.createdAt));
  }, [riders, query, lastActivity]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Clamp rather than reset on every filtered-length change: a page past the end (e.g. after a search) just snaps back to the last one.
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <AdminPage title="Klientai" description="Visi klientai: kontaktai, rezervacijos, pirkimai, dokumentai ir komentarai.">
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
            {paged.map((r) => (
              <Link key={r.id} href={`/admin/klientai/${r.id}`}>
                <Card>
                  <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                      <RiderAvatar name={r.name} surname={r.surname} avatarPath={r.avatarPath} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">
                          {r.name} {r.surname}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{r.phone || r.email || "Nėra kontaktų"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
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
