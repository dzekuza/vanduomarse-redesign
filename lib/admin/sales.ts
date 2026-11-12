import { bookingTypeLabel, bookingWhen, formatDay, quadRentalLabel } from "./format";
import { toCsv } from "./export";
import { BOOKING_STATUS } from "./labels";
import type { AdminData, BookingStatus } from "./types";
import { COUPON_STATUS_LABEL, type CouponStatus } from "@/lib/coupons";
import { todayKey } from "@/lib/sauna";

/** The product areas a sale belongs to; the filter tabs on the overview. */
export const SALE_CATEGORIES = [
  { id: "pirtis", label: "Pirtis" },
  { id: "nakvyne", label: "Nakvynė" },
  { id: "keturraciai", label: "Keturračiai" },
  { id: "renginiai", label: "Renginiai" },
  { id: "kuponai", label: "Kuponai" },
  { id: "vandenlentes", label: "Vandenlentės" },
] as const;

export type SaleCategory = (typeof SALE_CATEGORIES)[number]["id"];

/** Money state of a sale, folded from each source's own statuses. */
export type SaleState = "galioja" | "laukia" | "atsaukta";

export const SALE_STATE_LABEL: Record<SaleState, string> = {
  galioja: "Galioja",
  laukia: "Laukia",
  atsaukta: "Atšaukta",
};

/** What a click on a sale row opens: a details drawer on the overview (an event's tickets for ticket sales), or the page that manages it. */
export type SaleTarget = { kind: "booking" | "rental" | "coupon" | "event"; id: string } | { kind: "link"; href: string };

export interface Sale {
  id: string;
  category: SaleCategory;
  /** yyyy-mm-dd the sale was made (not the service date). */
  soldOn: string;
  /** What was sold, one line. */
  item: string;
  /** Service date and time, when the sale has one. */
  when: string;
  customer: string;
  reference: string;
  total: number;
  state: SaleState;
  /** The source's own status wording, for the badge. */
  statusLabel: string;
  target: SaleTarget;
  /** The linked customer (Klientai), when the sale is tied to one. */
  riderId: string | null;
}

const bookingState = (s: BookingStatus): SaleState => (s === "atsaukta" ? "atsaukta" : s === "laukia" ? "laukia" : "galioja");
const couponState = (s: CouponStatus): SaleState => (s === "atsauktas" ? "atsaukta" : s === "laukia_apmokejimo" ? "laukia" : "galioja");
/** The park-local (Europe/Vilnius) day of a timestamp, so every viewer sees the same sale date. */
const soldOn = (iso: string) => todayKey(new Date(iso));

type SalesSource = Pick<
  AdminData,
  "bookings" | "stayTypes" | "quadRentals" | "quadTypes" | "tourTickets" | "eventTickets" | "events" | "coupons" | "purchases" | "riders"
>;

/** Every sale from every source as one list, newest first. */
export function buildSales(data: SalesSource): Sale[] {
  const sales: Sale[] = [];

  for (const b of data.bookings) {
    const when = [formatDay(b.date), bookingWhen(b)].filter(Boolean).join(", ");
    sales.push({
      id: `b-${b.id}`,
      category: b.kind === "pirtis" ? "pirtis" : "nakvyne",
      soldOn: soldOn(b.createdAt),
      item: bookingTypeLabel(b, data.stayTypes),
      when,
      customer: b.customer.name,
      reference: b.reference,
      total: b.total,
      state: bookingState(b.status),
      statusLabel: BOOKING_STATUS[b.status],
      target: { kind: "booking", id: b.id },
      riderId: b.riderId ?? null,
    });
  }

  for (const r of data.quadRentals) {
    sales.push({
      id: `q-${r.id}`,
      category: "keturraciai",
      soldOn: soldOn(r.createdAt),
      item: quadRentalLabel(r, data.quadTypes),
      when: `${formatDay(r.date)}, ${r.hours} val.`,
      customer: r.customer.name,
      reference: r.reference,
      total: r.total,
      state: bookingState(r.status),
      statusLabel: BOOKING_STATUS[r.status],
      target: { kind: "rental", id: r.id },
      riderId: r.riderId ?? null,
    });
  }

  for (const t of data.tourTickets) {
    sales.push({
      id: `t-${t.id}`,
      category: "keturraciai",
      soldOn: soldOn(t.createdAt),
      item: `${t.eventTitle} · ${t.people} asm.`,
      when: `${formatDay(t.eventDate)}, ${t.eventTime}`,
      customer: t.customer.name,
      reference: t.reference,
      total: t.total,
      state: bookingState(t.status),
      statusLabel: BOOKING_STATUS[t.status],
      target: { kind: "event", id: t.eventId },
      riderId: t.riderId ?? null,
    });
  }

  // Public sauna sessions are Pirtis sales; everything else is an event ticket.
  const eventCategory = new Map(data.events.map((e) => [e.id, e.category]));
  for (const t of data.eventTickets) {
    sales.push({
      id: `e-${t.id}`,
      category: eventCategory.get(t.eventId) === "pirtis" ? "pirtis" : "renginiai",
      soldOn: soldOn(t.createdAt),
      item: `${t.eventTitle} · ${t.people} asm.`,
      when: `${formatDay(t.eventDate)}, ${t.eventTime}`,
      customer: t.customer.name,
      reference: t.reference,
      total: t.total,
      state: bookingState(t.status),
      statusLabel: BOOKING_STATUS[t.status],
      target: { kind: "event", id: t.eventId },
      riderId: t.riderId ?? null,
    });
  }

  for (const c of data.coupons) {
    sales.push({
      id: `c-${c.id}`,
      category: "kuponai",
      soldOn: soldOn(c.paidAt ?? c.createdAt),
      item: c.productName,
      when: "",
      customer: c.buyer.name,
      reference: c.reference,
      total: c.faceValue,
      state: couponState(c.status),
      statusLabel: COUPON_STATUS_LABEL[c.status],
      target: { kind: "coupon", id: c.id },
      riderId: c.riderId ?? null,
    });
  }

  const riderName = new Map(data.riders.map((r) => [r.id, `${r.name} ${r.surname}`.trim()]));
  for (const p of data.purchases) {
    sales.push({
      id: `p-${p.id}`,
      category: "vandenlentes",
      soldOn: soldOn(p.soldAt),
      item: p.planName,
      when: "",
      customer: riderName.get(p.riderId) ?? "—",
      reference: "",
      total: p.price ?? 0,
      state: "galioja",
      statusLabel: SALE_STATE_LABEL.galioja,
      target: { kind: "link", href: `/admin/klientai/${p.riderId}` },
      riderId: p.riderId,
    });
  }

  return sales.sort((a, b) => b.soldOn.localeCompare(a.soldOn) || b.id.localeCompare(a.id));
}

export type SaleStateFilter = "galiojancios" | "visos" | SaleState;

export interface SaleFilters {
  category: SaleCategory | "visos";
  state: SaleStateFilter;
  /** yyyy-mm-dd, "" = open-ended. */
  from: string;
  to: string;
  query: string;
}

export function filterSales(sales: readonly Sale[], f: SaleFilters): Sale[] {
  const q = f.query.trim().toLowerCase();
  return sales.filter(
    (s) =>
      (f.category === "visos" || s.category === f.category) &&
      (f.state === "visos" || (f.state === "galiojancios" ? s.state !== "atsaukta" : s.state === f.state)) &&
      (!f.from || s.soldOn >= f.from) &&
      (!f.to || s.soldOn <= f.to) &&
      (!q || [s.customer, s.reference, s.item].some((v) => v.toLowerCase().includes(q))),
  );
}

/**
 * Revenue of the sales that count: cancelled and unpaid ones are left out. Coupons are left out too unless
 * `withCoupons`: a coupon is paid for once and redeemed against a booking whose total is counted in full,
 * so adding both would count the same euros twice.
 */
export const salesRevenue = (sales: readonly Sale[], withCoupons = false) =>
  sales.filter((s) => s.state === "galioja" && (withCoupons || s.category !== "kuponai")).reduce((sum, s) => sum + s.total, 0);

export function salesToCsv(sales: readonly Sale[]): string {
  const label = (id: SaleCategory) => SALE_CATEGORIES.find((c) => c.id === id)?.label ?? id;
  return toCsv([
    ["Pardavimo data", "Kategorija", "Prekė", "Paslaugos laikas", "Klientas", "Nr.", "Suma €", "Būsena"],
    ...sales.map((s) => [s.soldOn, label(s.category), s.item, s.when, s.customer, s.reference, s.total.toFixed(2).replace(".", ","), s.statusLabel]),
  ]);
}
