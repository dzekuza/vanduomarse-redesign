import { makeCustomerLookup } from "@/lib/admin/customer-match";
import { bookingTypeLabel, bookingWhen, formatDay, quadRentalLabel } from "./format";
import { toCsv } from "./export";
import { BOOKING_SOURCE, BOOKING_STATUS } from "./labels";
import type { AdminData, BookingSource, BookingStatus } from "./types";
import { COUPON_STATUS_LABEL, type CouponStatus } from "@/lib/coupons";
import { PURCHASE_PAYMENT_LABELS } from "@/lib/ride-plans";
import { todayKey } from "@/lib/sauna";
import { spaceLabels } from "@/lib/space-booking";

/** The product areas a sale belongs to; the filter tabs on the overview. */
export const SALE_CATEGORIES = [
  { id: "pirtis", label: "Pirtis" },
  { id: "nakvyne", label: "Nakvynė" },
  { id: "keturraciai", label: "Keturračiai" },
  { id: "renginiai", label: "Renginiai" },
  { id: "erdves", label: "Erdvės" },
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

/** Who entered a sale: the customer on the site, or staff in the admin (by phone or on site). */
export type SaleOrigin = "internetu" | "admin";
export const SALE_ORIGIN_LABEL: Record<SaleOrigin, string> = { internetu: "Internetu", admin: "Admin" };
export const saleOrigin = (source: BookingSource): SaleOrigin => (source === "svetaine" ? "internetu" : "admin");

/** What a click on a sale row opens: a details drawer on the overview (an event's tickets for ticket sales), or the page that manages it. */
export type SaleTarget = { kind: "booking" | "rental" | "coupon" | "event" | "space"; id: string } | { kind: "link"; href: string };

export interface Sale {
  id: string;
  category: SaleCategory;
  /** yyyy-mm-dd the sale was made (not the service date). */
  soldOn: string;
  /** Full timestamp of the sale, to order sales made on the same day. */
  soldAt: string;
  /** yyyy-mm-dd (plus hh:mm when known) of the service, for sorting; "" when the sale has none. */
  whenKey: string;
  /** What was sold, one line. */
  item: string;
  /** Service date and time, when the sale has one. */
  when: string;
  customer: string;
  reference: string;
  total: number;
  state: SaleState;
  /** Where it came from: the site ("svetaine") or staff ("telefonu" / "vietoje"). Coupons are site-only; till plans are on site. */
  source: BookingSource;
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
> &
  Partial<Pick<AdminData, "spaceBookings" | "spaces">>;

export type SaleSortKey = "soldAt" | "item" | "category" | "when" | "customer" | "total" | "state" | "source";
export interface SaleSort {
  key: SaleSortKey;
  dir: "asc" | "desc";
}
/** Newest sale first, down to the minute, so two sales on one day list in the order they were made. */
export const DEFAULT_SALE_SORT: SaleSort = { key: "soldAt", dir: "desc" };

const collator = new Intl.Collator("lt");
const SORT_VALUE: Record<SaleSortKey, (s: Sale) => string | number> = {
  soldAt: (s) => Date.parse(s.soldAt),
  item: (s) => s.item,
  category: (s) => s.category,
  when: (s) => s.whenKey,
  customer: (s) => s.customer,
  total: (s) => s.total,
  state: (s) => (s.state === "galioja" ? s.statusLabel : SALE_STATE_LABEL[s.state]),
  source: (s) => SALE_ORIGIN_LABEL[saleOrigin(s.source)],
};

/** A sorted copy. Empty service dates always sink to the bottom; ties fall back to newest sale first. */
export function sortSales(sales: readonly Sale[], sort: SaleSort): Sale[] {
  const value = SORT_VALUE[sort.key];
  const sign = sort.dir === "asc" ? 1 : -1;
  return [...sales].sort((a, b) => {
    const x = value(a);
    const y = value(b);
    if (sort.key === "when" && (x === "") !== (y === "")) return x === "" ? 1 : -1;
    const cmp = typeof x === "number" && typeof y === "number" ? x - y : collator.compare(String(x), String(y));
    return cmp * sign || Date.parse(b.soldAt) - Date.parse(a.soldAt) || b.id.localeCompare(a.id);
  });
}

/** Every sale from every source as one list, newest first. */
export function buildSales(data: SalesSource): Sale[] {
  const sales: Sale[] = [];
  const customerOf = makeCustomerLookup(data.riders);

  for (const b of data.bookings) {
    const when = [formatDay(b.date), bookingWhen(b)].filter(Boolean).join(", ");
    sales.push({
      id: `b-${b.id}`,
      category: b.kind === "pirtis" ? "pirtis" : "nakvyne",
      soldOn: soldOn(b.createdAt),
      soldAt: b.createdAt,
      whenKey: `${b.date} ${String(b.startHour ?? 0).padStart(2, "0")}`,
      item: bookingTypeLabel(b, data.stayTypes),
      when,
      customer: b.customer.name,
      reference: b.reference,
      total: b.total,
      state: bookingState(b.status),
      source: b.source ?? "svetaine",
      statusLabel: BOOKING_STATUS[b.status],
      target: { kind: "booking", id: b.id },
      riderId: b.riderId ?? customerOf(b.customer) ?? null,
    });
  }

  for (const r of data.quadRentals) {
    sales.push({
      id: `q-${r.id}`,
      category: "keturraciai",
      soldOn: soldOn(r.createdAt),
      soldAt: r.createdAt,
      whenKey: `${r.date} ${String(r.startHour).padStart(2, "0")}`,
      item: quadRentalLabel(r, data.quadTypes),
      when: `${formatDay(r.date)}, ${r.hours} val.`,
      customer: r.customer.name,
      reference: r.reference,
      total: r.total,
      state: bookingState(r.status),
      source: r.source,
      statusLabel: BOOKING_STATUS[r.status],
      target: { kind: "rental", id: r.id },
      riderId: r.riderId ?? customerOf(r.customer) ?? null,
    });
  }

  for (const t of data.tourTickets) {
    sales.push({
      id: `t-${t.id}`,
      category: "keturraciai",
      soldOn: soldOn(t.createdAt),
      soldAt: t.createdAt,
      whenKey: `${t.eventDate} ${t.eventTime}`,
      item: `${t.eventTitle} · ${t.people} asm.`,
      when: `${formatDay(t.eventDate)}, ${t.eventTime}`,
      customer: t.customer.name,
      reference: t.reference,
      total: t.total,
      state: bookingState(t.status),
      source: t.source,
      statusLabel: BOOKING_STATUS[t.status],
      target: { kind: "event", id: t.eventId },
      riderId: t.riderId ?? customerOf(t.customer) ?? null,
    });
  }

  // Public sauna sessions are Pirtis sales; everything else is an event ticket.
  const eventCategory = new Map(data.events.map((e) => [e.id, e.category]));
  for (const t of data.eventTickets) {
    sales.push({
      id: `e-${t.id}`,
      category: eventCategory.get(t.eventId) === "pirtis" ? "pirtis" : "renginiai",
      soldOn: soldOn(t.createdAt),
      soldAt: t.createdAt,
      whenKey: `${t.eventDate} ${t.eventTime}`,
      item: `${t.eventTitle} · ${t.people} asm.`,
      when: `${formatDay(t.eventDate)}, ${t.eventTime}`,
      customer: t.customer.name,
      reference: t.reference,
      total: t.total,
      state: bookingState(t.status),
      source: t.source,
      statusLabel: BOOKING_STATUS[t.status],
      target: { kind: "event", id: t.eventId },
      riderId: t.riderId ?? customerOf(t.customer) ?? null,
    });
  }

  // Event-space hires (ADR-0124) are entered by staff only, so they count as Admin sales; the agreed price is the total.
  for (const s of data.spaceBookings ?? []) {
    const customer = { name: [s.customer.name, s.customer.surname].filter(Boolean).join(" "), email: s.customer.email, phone: s.customer.phone };
    sales.push({
      id: `s-${s.id}`,
      category: "erdves",
      soldOn: soldOn(s.createdAt),
      soldAt: s.createdAt,
      whenKey: `${s.date} ${s.startTime}`,
      item: spaceLabels(s.spaces, data.spaces ?? []),
      when: s.endDate === s.date ? `${formatDay(s.date)}, ${s.startTime}–${s.endTime}` : `${formatDay(s.date)} ${s.startTime} – ${formatDay(s.endDate)} ${s.endTime}`,
      customer: customer.name,
      reference: "",
      total: s.price,
      state: bookingState(s.status),
      source: "telefonu",
      statusLabel: BOOKING_STATUS[s.status],
      target: { kind: "space", id: s.id },
      riderId: customerOf(customer) ?? null,
    });
  }

  for (const c of data.coupons) {
    sales.push({
      id: `c-${c.id}`,
      category: "kuponai",
      soldOn: soldOn(c.paidAt ?? c.createdAt),
      soldAt: c.paidAt ?? c.createdAt,
      whenKey: "",
      item: c.productName,
      when: "",
      customer: c.buyer.name,
      reference: c.reference,
      total: c.faceValue,
      state: couponState(c.status),
      source: "svetaine",
      statusLabel: COUPON_STATUS_LABEL[c.status],
      target: { kind: "coupon", id: c.id },
      riderId: c.riderId ?? customerOf({ email: c.buyer.email }) ?? null,
    });
  }

  const riderName = new Map(data.riders.map((r) => [r.id, `${r.name} ${r.surname}`.trim()]));
  for (const p of data.purchases) {
    sales.push({
      id: `p-${p.id}`,
      category: "vandenlentes",
      soldOn: soldOn(p.soldAt),
      soldAt: p.soldAt,
      whenKey: "",
      item: p.planName,
      when: p.paymentMethod ? PURCHASE_PAYMENT_LABELS[p.paymentMethod] : "",
      customer: riderName.get(p.riderId) ?? "—",
      reference: "",
      total: p.price ?? 0,
      state: "galioja",
      source: "vietoje",
      statusLabel: SALE_STATE_LABEL.galioja,
      target: { kind: "link", href: `/admin/klientai/${p.riderId}` },
      riderId: p.riderId,
    });
  }

  return sortSales(sales, DEFAULT_SALE_SORT);
}

export type SaleStateFilter = "galiojancios" | "visos" | SaleState;

export interface SaleFilters {
  category: SaleCategory | "visos";
  state: SaleStateFilter;
  origin: SaleOrigin | "visi";
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
      (f.origin === "visi" || saleOrigin(s.source) === f.origin) &&
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
    ["Pardavimo data", "Kategorija", "Prekė", "Paslaugos laikas", "Klientas", "Nr.", "Suma €", "Būsena", "Šaltinis"],
    ...sales.map((s) => [s.soldOn, label(s.category), s.item, s.when, s.customer, s.reference, s.total.toFixed(2).replace(".", ","), s.statusLabel, BOOKING_SOURCE[s.source]]),
  ]);
}
