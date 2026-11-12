"use client";

import { useState } from "react";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { CouponList } from "./coupon-list";
import { CouponProductsCard } from "./coupon-products-card";
import { CouponSheet } from "./coupon-sheet";
import { Input } from "@/components/ui/input";
import { COUPON_STATUS_LABEL, normalizeCode, type CouponStatus } from "@/lib/coupons";

type Filter = CouponStatus | "visi";

/** Coupon orders: confirm payment, redeem, cancel; plus the catalogue customers buy from. */
export function CouponsView() {
  const { coupons } = useAdmin();
  const [filter, setFilter] = useState<Filter>("visi");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const statuses = Object.keys(COUPON_STATUS_LABEL) as CouponStatus[];
  const chips: { id: Filter; label: string; count: number }[] = [
    { id: "visi", label: "Visi", count: coupons.length },
    ...statuses.map((s) => ({ id: s, label: COUPON_STATUS_LABEL[s], count: coupons.filter((c) => c.status === s).length })),
  ];

  const q = query.trim().toLowerCase();
  const code = normalizeCode(query);
  const rows = coupons
    .filter((c) => filter === "visi" || c.status === filter)
    .filter(
      (c) =>
        !q ||
        c.reference.toLowerCase().includes(q) ||
        c.buyer.name.toLowerCase().includes(q) ||
        c.buyer.email.toLowerCase().includes(q) ||
        c.recipientName.toLowerCase().includes(q) ||
        c.recipientEmail.toLowerCase().includes(q) ||
        (code.length >= 4 && c.code?.includes(code)),
    )
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <AdminPage title="Kuponai" description="Dovanų kuponų užsakymai iš /kuponai: patvirtinkite apmokėjimą, kad klientas gautų kodą, ir nuskaitykite panaudojimą.">
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Būsenos filtras" className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={filter === c.id}
              onClick={() => setFilter(c.id)}
              className={`flex min-h-11 items-center gap-2 border px-4 text-sm transition-colors ${filter === c.id ? "border-ink bg-ink text-foam" : "bg-card hover:bg-muted"}`}
            >
              {c.label}
              <span className={filter === c.id ? "text-foam/60" : "text-muted-foreground"}>{c.count}</span>
            </button>
          ))}
        </div>
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Kodas, numeris, vardas ar el. paštas"
          aria-label="Ieškoti kuponų"
          className="min-h-11 md:ml-auto md:max-w-xs"
        />
      </div>

      <CouponList
        key={`${filter}|${query}`}
        coupons={rows}
        emptyText={coupons.length === 0 ? "Užsakymų dar nėra." : "Pagal šiuos kriterijus kuponų nėra."}
        onOpen={setOpenId}
      />

      <CouponProductsCard />
      <CouponSheet coupon={coupons.find((c) => c.id === openId) ?? null} onOpenChange={(o) => !o && setOpenId(null)} />
    </AdminPage>
  );
}
