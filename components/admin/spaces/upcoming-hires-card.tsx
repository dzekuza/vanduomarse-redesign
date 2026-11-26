"use client";

import { useState } from "react";
import { useAdmin } from "../admin-store";
import { BookingStatusBadge } from "../status-badge";
import { SpaceBookingSheet } from "./space-booking-sheet";
import { formatDay, formatEur } from "@/lib/admin/format";
import { spaceLabels } from "@/lib/space-booking";
import { todayKey } from "@/lib/sauna";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Space hires that have not ended yet, soonest first; a row opens the hire's sheet. They also show on Kalendorius. */
export function UpcomingHiresCard() {
  const { spaceBookings, spaces } = useAdmin();
  const [openId, setOpenId] = useState<string | null>(null);
  const today = todayKey();
  const upcoming = spaceBookings.filter((b) => b.endDate >= today && b.status !== "atsaukta").toSorted((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Artimiausios nuomos</CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        {upcoming.length === 0 ? <p className="py-3 text-sm text-muted-foreground">Būsimų nuomų nėra.</p> : null}
        {upcoming.map((b) => (
          <button key={b.id} type="button" onClick={() => setOpenId(b.id)} className="flex min-h-11 w-full items-center gap-3 py-3 text-left hover:bg-muted">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{spaceLabels(b.spaces, spaces)}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {formatDay(b.date)} {b.startTime}–{b.endDate !== b.date ? `${formatDay(b.endDate)} ` : ""}{b.endTime} · {[b.customer.name, b.customer.surname].filter(Boolean).join(" ")}
              </span>
            </span>
            <span className="shrink-0 text-sm font-bold tabular-nums">{formatEur(b.price)}</span>
            <BookingStatusBadge status={b.status} />
          </button>
        ))}
      </CardContent>
      <SpaceBookingSheet booking={spaceBookings.find((b) => b.id === openId) ?? null} onOpenChange={(o) => !o && setOpenId(null)} />
    </Card>
  );
}
