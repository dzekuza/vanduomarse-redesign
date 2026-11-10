"use client";

import { useState } from "react";
import { useAdmin } from "../admin-store";
import { BookingStatusBadge, PaymentBadge } from "../status-badge";
import { RentalSheet } from "./rental-sheet";
import { StatusActions } from "./status-actions";
import { formatDay } from "@/lib/admin/format";
import { hourLabel } from "@/lib/quads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Seat requests for guided tours. The tours themselves (events of category Keturračiai) are listed and created above, in QuadsView. */
export function ToursTab() {
  const { tourTickets, setTourTicketStatus, quadRentals, quadTourRoutes } = useAdmin();
  const [openId, setOpenId] = useState<string | null>(null);
  const rentals = quadRentals
    .filter((r) => r.tourRouteId)
    .toSorted((a, b) => Number(b.status === "laukia") - Number(a.status === "laukia") || `${a.date}${String(a.startHour).padStart(2, "0")}`.localeCompare(`${b.date}${String(b.startHour).padStart(2, "0")}`));
  const rows = tourTickets.toSorted(
    (a, b) => Number(b.status === "laukia") - Number(a.status === "laukia") || `${a.eventDate}${a.eventTime}`.localeCompare(`${b.eventDate}${b.eventTime}`),
  );

  return (
    <div className="space-y-6">
      <h2 className="font-display text-figure font-bold">Registracijos</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rentals.map((r) => (
          <Card key={r.id} className="relative h-full transition-colors focus-within:border-ink hover:border-ink">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <CardTitle className="min-w-0 text-item">
                <button type="button" onClick={() => setOpenId(r.id)} className="wrap-anywhere text-left after:absolute after:inset-0 focus-visible:outline-none">
                  {quadTourRoutes.find((route) => route.id === r.tourRouteId)?.name ?? "Turas"} turas
                </button>
              </CardTitle>
              <div className="flex flex-wrap justify-end gap-1">
                <BookingStatusBadge status={r.status} />
                <PaymentBadge payment={r.payment} />
              </div>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>
                {formatDay(r.date)} · {hourLabel(r.startHour)}–{hourLabel(r.startHour + r.hours)}
              </p>
              <p>
                <span className="font-display text-figure font-bold">{r.units}</span> keturr. · {r.total} €
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {r.customer.name} · {r.reference}
              </p>
            </CardContent>
          </Card>
        ))}
        {rows.map((t) => (
          <Card key={t.id} className="h-full">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <CardTitle className="text-item">{t.eventTitle}</CardTitle>
              <div className="flex flex-wrap justify-end gap-1">
                <BookingStatusBadge status={t.status} />
                <PaymentBadge payment={t.payment} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                {formatDay(t.eventDate)} · {t.eventTime}
              </p>
              <p>
                <span className="font-display text-figure font-bold">{t.people}</span> asm. · {t.total} €
              </p>
              <p className="text-xs text-muted-foreground">
                {t.customer.name} · {t.customer.phone || t.customer.email} · {t.reference}
              </p>
              <StatusActions status={t.status} onSet={(s) => setTourTicketStatus(t.id, s)} />
            </CardContent>
          </Card>
        ))}
      </div>
      {rows.length === 0 && rentals.length === 0 ? <p className="text-sm text-muted-foreground">Registracijų į turus dar nėra.</p> : null}
      <RentalSheet rental={quadRentals.find((r) => r.id === openId) ?? null} onOpenChange={(o) => !o && setOpenId(null)} />
    </div>
  );
}
