"use client";

import { useMemo, useState } from "react";
import { useAdmin } from "../admin-store";
import { buildSales, type SaleFilters } from "@/lib/admin/sales";
import { computeSalesStats } from "@/lib/admin/sales-stats";

const initialFilters = (): SaleFilters => ({
  category: "visos",
  state: "galiojancios",
  from: "",
  to: "",
  query: "",
});

/** All sales plus the shared filters and the stats they produce, so the stats block and the Pardavimai table stay in step. */
export function useSales() {
  const { bookings, quadRentals, quadTypes, tourTickets, eventTickets, events, coupons, purchases, riders } = useAdmin();
  const [filters, setFilters] = useState(initialFilters);
  const all = useMemo(
    () => buildSales({ bookings, quadRentals, quadTypes, tourTickets, eventTickets, events, coupons, purchases, riders }),
    [bookings, quadRentals, quadTypes, tourTickets, eventTickets, events, coupons, purchases, riders],
  );
  const stats = useMemo(() => computeSalesStats(all, filters), [all, filters]);
  return { all, filters, setFilters, stats };
}
