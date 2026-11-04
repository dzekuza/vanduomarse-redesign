"use client";

import Link from "next/link";
import { useAdmin } from "../admin-store";
import { BookingStatusBadge, PaymentBadge } from "../status-badge";
import { StatusActions } from "./status-actions";
import { formatDay } from "@/lib/admin/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Seat requests for guided tours. The tours themselves are events of category Keturračiai. */
export function ToursTab() {
  const { tourTickets, setTourTicketStatus } = useAdmin();
  const rows = tourTickets.toSorted(
    (a, b) => Number(b.status === "laukia") - Number(a.status === "laukia") || `${a.eventDate}${a.eventTime}`.localeCompare(`${b.eventDate}${b.eventTime}`),
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Žygius (data, laikas, vietų skaičius, kaina) sukurkite skyriuje{" "}
        <Link href="/admin/renginiai" className="underline underline-offset-4 hover:text-rust">
          Renginiai
        </Link>{" "}
        su kategorija „Keturračiai“ ir paskelbkite. Čia patvirtinate registracijas.
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">Registracijų į žygius dar nėra.</p> : null}
    </div>
  );
}
