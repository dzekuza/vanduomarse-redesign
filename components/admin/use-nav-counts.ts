"use client";

import { useAdmin } from "./admin-store";
import type { AdminNavItem } from "./admin-nav";

/** Live badge numbers for nav items: work waiting on staff. */
export function useNavCounts(): Record<NonNullable<AdminNavItem["badge"]>, number> {
  const { bookings, inquiries, coupons, quadRentals, tourTickets, eventTickets } = useAdmin();
  return {
    pendingBookings: bookings.filter((b) => b.status === "laukia").length,
    newInquiries: inquiries.filter((q) => q.status === "nauja").length,
    pendingEvents: eventTickets.filter((t) => t.status === "laukia").length,
    pendingCoupons: coupons.filter((c) => c.status === "laukia_apmokejimo").length,
    pendingQuads: quadRentals.filter((r) => r.status === "laukia").length + tourTickets.filter((t) => t.status === "laukia").length,
  };
}
