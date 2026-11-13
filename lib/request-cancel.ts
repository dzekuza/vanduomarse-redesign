import { todayKey, vilniusHour } from "@/lib/sauna";

/** A paid request cancelled at least this long before it starts is refunded in full, automatically (ADR-0087). */
export const CANCEL_REFUND_HOURS = 24;

/** What the customer may do with one of their requests: cancel it (`yes`), only by calling us (`late`), or nothing (`no`). */
export type CancelState = "yes" | "late" | "no";

/**
 * Hours from now (park time, Europe/Vilnius) until a request starts; negative once it has. `hour` is the start hour of
 * the day (a stay has no start hour: 0, so it counts from the start of its first day).
 */
export function hoursUntilStart(date: string, hour: number, now: Date = new Date()): number {
  const [y, m, d] = date.split("-").map(Number);
  const [ny, nm, nd] = todayKey(now).split("-").map(Number);
  const target = Date.UTC(y, m - 1, d, hour);
  const current = Date.UTC(ny, nm - 1, nd, vilniusHour(now), now.getUTCMinutes());
  return (target - current) / 3_600_000;
}

interface PolicyInput {
  status: "laukia" | "patvirtinta" | "ivykdyta" | "atsaukta";
  /** Stripe payment status, null when not paid online. */
  payment: "laukia" | "apmoketa" | "pasibaige" | "nepavyko" | "grazinta" | null;
  /** yyyy-mm-dd, "" when unknown. */
  date: string;
  startHour: number;
  total: number;
}

/**
 * The one rule behind the "Atšaukti" button and the server action that obeys it. Requests still waiting for their Stripe
 * payment have their own cancel (it closes the Checkout Session), so they are `no` here. `refund` is what comes back.
 */
export function cancelPolicy(r: PolicyInput, now: Date = new Date()): { state: CancelState; refund: number } {
  if ((r.status !== "laukia" && r.status !== "patvirtinta") || r.payment === "laukia" || !r.date) return { state: "no", refund: 0 };
  const hours = hoursUntilStart(r.date, r.startHour, now);
  if (hours <= 0) return { state: "no", refund: 0 };
  const paid = r.payment === "apmoketa" && r.total > 0;
  if (paid && hours < CANCEL_REFUND_HOURS) return { state: "late", refund: 0 };
  return { state: "yes", refund: paid ? r.total : 0 };
}
