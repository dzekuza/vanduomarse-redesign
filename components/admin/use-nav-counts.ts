"use client";

import { useAdmin } from "./admin-store";
import type { AdminNavItem } from "./admin-nav";

/** Live badge numbers for nav items: work waiting on staff. */
export function useNavCounts(): Record<NonNullable<AdminNavItem["badge"]>, number> {
  const { bookings, inquiries, coupons, quadRentals, tourTickets, eventTickets } = useAdmin();
  const pendingBookings = bookings.filter((b) => b.status === "laukia").length;
  const newInquiries = inquiries.filter((q) => q.status === "nauja").length;
  const pendingCoupons = coupons.filter((c) => c.status === "laukia_apmokejimo").length;
  const pendingQuads = quadRentals.filter((r) => r.status === "laukia").length + tourTickets.filter((t) => t.status === "laukia").length;
  return {
    pendingBookings,
    newInquiries,
    pendingEvents: eventTickets.filter((t) => t.status === "laukia").length,
    pendingCoupons,
    pendingQuads,
    /** Everything waiting on staff across bookings, coupons, quads and inquiries — shown on Apžvalga. */
    pendingAll: pendingBookings + pendingCoupons + pendingQuads + newInquiries,
  };
}
