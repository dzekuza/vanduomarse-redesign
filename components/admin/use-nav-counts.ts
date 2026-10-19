"use client";

import { useAdmin } from "./admin-store";
import type { AdminNavItem } from "./admin-nav";

/** Live badge numbers for nav items: work waiting on staff. */
export function useNavCounts(): Record<NonNullable<AdminNavItem["badge"]>, number> {
  const { bookings, inquiries } = useAdmin();
  return {
    pendingBookings: bookings.filter((b) => b.status === "laukia").length,
    newInquiries: inquiries.filter((q) => q.status === "nauja").length,
  };
}
