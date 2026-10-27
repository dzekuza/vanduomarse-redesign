"use client";

import { useState } from "react";
import { useAdmin } from "../admin-store";
import { BookingStatusBadge } from "../status-badge";
import { RentalSheet } from "./rental-sheet";
import { formatDay } from "@/lib/admin/format";
import { BOOKING_STATUS } from "@/lib/admin/labels";
import type { BookingStatus } from "@/lib/admin/types";
import { hourLabel } from "@/lib/quads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Filter = BookingStatus | "visos";

/** Hourly rental requests: pending first, then by date. */
export function RentalsTab() {
  const { quadRentals, quadTypes } = useAdmin();
  const [filter, setFilter] = useState<Filter>("visos");
  const [openId, setOpenId] = useState<string | null>(null);

  const statuses = Object.keys(BOOKING_STATUS) as BookingStatus[];
  const chips: { id: Filter; label: string; count: number }[] = [
    { id: "visos", label: "Visos", count: quadRentals.length },
    ...statuses.map((s) => ({ id: s, label: BOOKING_STATUS[s], count: quadRentals.filter((r) => r.status === s).length })),
  ];
  const rows = quadRentals
    .filter((r) => filter === "visos" || r.status === filter)
    .toSorted((a, b) => Number(b.status === "laukia") - Number(a.status === "laukia") || `${a.date}${String(a.startHour).padStart(2, "0")}`.localeCompare(`${b.date}${String(b.startHour).padStart(2, "0")}`));

  return (
    <div className="space-y-6">
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((r) => (
          <Card key={r.id} className="relative h-full transition-colors focus-within:border-ink hover:border-ink">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <CardTitle className="text-base">
                <button type="button" onClick={() => setOpenId(r.id)} className="text-left after:absolute after:inset-0 focus-visible:outline-none">
                  {r.units} × {quadTypes.find((t) => t.id === r.quadTypeId)?.name ?? r.quadTypeId}
                </button>
              </CardTitle>
              <BookingStatusBadge status={r.status} />
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>
                {formatDay(r.date)} · {hourLabel(r.startHour)}–{hourLabel(r.startHour + r.hours)}
              </p>
              <p className="font-display text-lg font-bold">{r.total} €</p>
              <p className="truncate text-xs text-muted-foreground">
                {r.customer.name} · {r.reference}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">{quadRentals.length === 0 ? "Užklausų dar nėra." : "Su šia būsena nuomų nėra."}</p> : null}

      <RentalSheet rental={quadRentals.find((r) => r.id === openId) ?? null} onOpenChange={(o) => !o && setOpenId(null)} />
    </div>
  );
}
