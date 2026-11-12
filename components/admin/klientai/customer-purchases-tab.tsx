"use client";

import { useMemo } from "react";
import { useAdmin } from "../admin-store";
import { useSaleDetails } from "../overview/sale-details";
import { SaleStatusBadge } from "../status-badge";
import { formatDay, formatEur } from "@/lib/admin/format";
import { buildSales, SALE_CATEGORIES, salesRevenue } from "@/lib/admin/sales";

const CATEGORY_LABEL = Object.fromEntries(SALE_CATEGORIES.map((c) => [c.id, c.label]));

/**
 * All of one customer's orders: reservations, quad rentals, tickets, gift coupons and bracelet plans, newest first, with
 * the same status badges as the sales table. A click opens the booking, rental, coupon or event details in place.
 * Only orders linked to this customer (Klientai) are listed.
 */
export function CustomerPurchasesTab({ riderId }: { riderId: string }) {
  const { bookings, stayTypes, quadRentals, quadTypes, tourTickets, eventTickets, events, coupons, purchases, riders } = useAdmin();
  const { openSale, sheets } = useSaleDetails();

  const rows = useMemo(
    () => buildSales({ bookings, stayTypes, quadRentals, quadTypes, tourTickets, eventTickets, events, coupons, purchases, riders }).filter((s) => s.riderId === riderId),
    [bookings, stayTypes, quadRentals, quadTypes, tourTickets, eventTickets, events, coupons, purchases, riders, riderId],
  );

  if (rows.length === 0) return <p className="py-3 text-sm text-muted-foreground">Pirkimų dar nėra.</p>;

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-3">
        <p className="text-sm text-muted-foreground">Pirkimų: {rows.length}</p>
        <p className="text-sm">
          Iš viso (be kuponų ir atšauktų): <span className="font-display text-figure font-bold tabular-nums">{formatEur(salesRevenue(rows))}</span>
        </p>
      </div>
      <ul className="divide-y">
        {rows.map((s) => {
          const body = (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{s.item}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {[CATEGORY_LABEL[s.category], s.when, s.reference, `parduota ${formatDay(s.soldOn)}`].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className="shrink-0 font-display text-sm font-bold tabular-nums">{formatEur(s.total)}</span>
              <SaleStatusBadge state={s.state} label={s.statusLabel} />
            </>
          );
          return (
            <li key={s.id}>
              {s.target.kind === "link" ? (
                <div className="flex min-h-11 items-center gap-3 py-3">{body}</div>
              ) : (
                <button type="button" onClick={() => openSale(s.target)} className="flex min-h-11 w-full items-center gap-3 py-3 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring">
                  {body}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {sheets}
    </>
  );
}
