import { parseDay } from "./format";
import { filterSales, salesRevenue, type Sale, type SaleFilters } from "./sales";
import { dateKey } from "@/lib/sauna";

const DAY_MS = 86_400_000;

const addDays = (key: string, n: number) => {
  const d = parseDay(key);
  return dateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
};
const daysBetween = (from: string, to: string) => Math.round((parseDay(to).getTime() - parseDay(from).getTime()) / DAY_MS) + 1;

export interface SalesSummary {
  revenue: number;
  count: number;
  average: number;
}

const summarize = (sales: readonly Sale[], withCoupons: boolean): SalesSummary => {
  const valid = sales.filter((s) => s.state === "galioja" && (withCoupons || s.category !== "kuponai"));
  const revenue = salesRevenue(valid, withCoupons);
  return { revenue, count: valid.length, average: valid.length ? revenue / valid.length : 0 };
};

export interface SalesStats {
  /** Face value of valid coupons sold in the range (not part of `current`, see `salesRevenue`). */
  couponsSold: number;
  current: SalesSummary;
  /** The window of the same length right before the chosen range; null when the range is open-ended. */
  previous: SalesSummary | null;
}

/** % change from `before` to `now`; null when there is nothing to compare with. */
export const changePercent = (now: number, before: number): number | null => (before > 0 ? Math.round(((now - before) / before) * 100) : null);

/** Summary and previous-period comparison for the chosen filters. */
export function computeSalesStats(all: readonly Sale[], filters: SaleFilters): SalesStats {
  const rows = filterSales(all, filters);
  // Coupons only count when the Kuponai tab itself is chosen.
  const withCoupons = filters.category === "kuponai";
  const current = summarize(rows, withCoupons);

  let previous: SalesSummary | null = null;
  if (filters.from && filters.to) {
    const span = daysBetween(filters.from, filters.to);
    const to = addDays(filters.from, -1);
    previous = summarize(filterSales(all, { ...filters, from: addDays(to, -(span - 1)), to }), withCoupons);
  }

  const couponsSold =
    filters.category !== "visos" ? 0 : salesRevenue(filterSales(all, filters).filter((s) => s.state === "galioja" && s.category === "kuponai"), true);
  return { couponsSold, current, previous };
}
