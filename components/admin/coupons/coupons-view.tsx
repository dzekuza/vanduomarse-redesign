"use client";

import { useState } from "react";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { CouponList } from "./coupon-list";
import { CouponProductsCard } from "./coupon-products-card";
import { CouponSheet } from "./coupon-sheet";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUPON_SERVICE_LABEL, COUPON_STATUS_LABEL, normalizeCode, type CouponService, type CouponStatus } from "@/lib/coupons";
import { dateKey } from "@/lib/sauna";

type Filter = CouponStatus | "visi";
type ServiceFilter = CouponService | "visi";

/** Coupon orders: confirm payment, redeem, cancel; plus the catalogue customers buy from. */
export function CouponsView() {
  const { coupons } = useAdmin();
  const [filter, setFilter] = useState<Filter>("visi");
  const [query, setQuery] = useState("");
  const [service, setService] = useState<ServiceFilter>("visi");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
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
    .filter((c) => service === "visi" || c.service === service)
    .filter((c) => {
      const day = dateKey(new Date(c.createdAt));
      return (!from || day >= from) && (!to || day <= to);
    })
    .filter(
      (c) =>
        !q ||
        c.reference.toLowerCase().includes(q) ||
        c.buyer.name.toLowerCase().includes(q) ||
        c.buyer.email.toLowerCase().includes(q) ||
        c.recipientName.toLowerCase().includes(q) ||
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

      <div className="grid gap-2 sm:grid-cols-3">
        <Select value={service} onValueChange={(v) => setService(v as ServiceFilter)}>
          <SelectTrigger className="w-full" aria-label="Paslauga">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="visi">Visos paslaugos</SelectItem>
            {(Object.keys(COUPON_SERVICE_LABEL) as CouponService[]).map((s) => (
              <SelectItem key={s} value={s}>
                {COUPON_SERVICE_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DatePicker value={from} max={to || undefined} onChange={setFrom} placeholder="Užsakyta nuo" />
        <DatePicker value={to} min={from || undefined} onChange={setTo} placeholder="Užsakyta iki" />
      </div>

      <CouponList
        key={`${filter}|${service}|${from}|${to}|${query}`}
        coupons={rows}
        emptyText={coupons.length === 0 ? "Užsakymų dar nėra." : "Pagal šiuos kriterijus kuponų nėra."}
        onOpen={setOpenId}
      />

      <CouponProductsCard />
      <CouponSheet coupon={coupons.find((c) => c.id === openId) ?? null} onOpenChange={(o) => !o && setOpenId(null)} />
    </AdminPage>
  );
}
