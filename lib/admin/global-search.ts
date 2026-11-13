import { normPhone } from "@/lib/admin/customer-match";
import { bookingTypeLabel, formatDay, quadRentalLabel } from "@/lib/admin/format";
import type { SaleTarget } from "@/lib/admin/sales";
import type { AdminData } from "@/lib/admin/types";

/** Where a hit comes from, in the order the groups are shown. */
export const SEARCH_GROUPS = [
  { id: "klientai", label: "Klientai" },
  { id: "rezervacijos", label: "Rezervacijos" },
  { id: "keturraciai", label: "Keturračiai" },
  { id: "bilietai", label: "Bilietai" },
  { id: "renginiai", label: "Renginiai" },
  { id: "kuponai", label: "Kuponai" },
  { id: "uzklausos", label: "Užklausos" },
] as const;

export type SearchGroup = (typeof SEARCH_GROUPS)[number]["id"];

export interface SearchHit {
  key: string;
  group: SearchGroup;
  title: string;
  subtitle: string;
  /** Same targets as a sale row: a details panel in place, or the page that manages it. */
  target: SaleTarget;
}

export type SearchSource = Pick<
  AdminData,
  "riders" | "bookings" | "stayTypes" | "quadRentals" | "quadTypes" | "tourTickets" | "eventTickets" | "events" | "coupons" | "inquiries"
>;

/** Fewest characters before a query searches anything. */
export const MIN_QUERY = 2;

const fold = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

interface Searchable {
  /** Folded text of every searchable field. */
  text: string;
  /** Stored phone numbers as 370… digits. */
  phones: string[];
}

const searchable = (fields: readonly (string | null | undefined)[], phones: readonly (string | null | undefined)[] = []): Searchable => ({
  text: fold(fields.filter(Boolean).join(" ")),
  phones: phones.filter((p): p is string => !!p).map(normPhone),
});

/** Every typed word must be found: as text, or (a run of digits) inside a phone number. */
function matches(item: Searchable, words: readonly string[]): boolean {
  return words.every((word) => {
    if (item.text.includes(word)) return true;
    if (!/^\+?\d{3,}$/.test(word)) return false;
    const bare = word.replace(/^\+/, "");
    const digits = bare.length >= 8 ? normPhone(bare) : bare.replace(/^8(?=\d{3,})/, "");
    return item.phones.some((p) => p.includes(digits));
  });
}

/**
 * One search over the data the admin already holds: customers, reservations, quad rentals, tickets, events, coupons
 * and inquiries, by name, reference, e-mail, phone or title (diacritics ignored). At most `perGroup` hits per group,
 * newest first where the source has a date. What a role may not read is not loaded, so it never shows up here.
 */
export function searchAdmin(data: SearchSource, query: string, perGroup = 5): SearchHit[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.join("").length < MIN_QUERY) return [];

  const hits: SearchHit[] = [];
  const add = <T extends object>(rows: readonly T[], test: (row: T) => Searchable, make: (row: T) => SearchHit) => {
    const found = rows.filter((row) => matches(test(row), words));
    const created = (row: T) => ("createdAt" in row && typeof row.createdAt === "string" ? row.createdAt : "");
    found.sort((a, b) => created(b).localeCompare(created(a)));
    for (const row of found.slice(0, perGroup)) hits.push(make(row));
  };

  add(
    data.riders,
    (r) => searchable([r.name, r.surname, r.email], [r.phone, r.phone2]),
    (r) => ({
      key: `rider-${r.id}`,
      group: "klientai",
      title: `${r.name} ${r.surname}`.trim(),
      subtitle: [r.phone, r.email].filter(Boolean).join(" · ") || "Be kontaktų",
      target: { kind: "link", href: `/admin/klientai/${r.id}` },
    }),
  );
  add(
    data.bookings,
    (b) => searchable([b.reference, b.customer.name, b.customer.email], [b.customer.phone]),
    (b) => ({
      key: `booking-${b.id}`,
      group: "rezervacijos",
      title: b.customer.name,
      subtitle: [bookingTypeLabel(b, data.stayTypes), formatDay(b.date), b.reference].join(" · "),
      target: { kind: "booking", id: b.id },
    }),
  );
  add(
    data.quadRentals,
    (r) => searchable([r.reference, r.customer.name, r.customer.email], [r.customer.phone]),
    (r) => ({
      key: `rental-${r.id}`,
      group: "keturraciai",
      title: r.customer.name,
      subtitle: [quadRentalLabel(r, data.quadTypes), formatDay(r.date), r.reference].join(" · "),
      target: { kind: "rental", id: r.id },
    }),
  );
  add(
    [...data.tourTickets, ...data.eventTickets],
    (t) => searchable([t.reference, t.customer.name, t.customer.email, t.eventTitle], [t.customer.phone]),
    (t) => ({
      key: `ticket-${t.id}`,
      group: "bilietai",
      title: t.customer.name,
      subtitle: [t.eventTitle, formatDay(t.eventDate), t.reference].join(" · "),
      target: { kind: "event", id: t.eventId },
    }),
  );
  add(
    data.events,
    (e) => searchable([e.title, e.place]),
    (e) => ({
      key: `event-${e.id}`,
      group: "renginiai",
      title: e.title,
      subtitle: [formatDay(e.date), e.time, e.place].filter(Boolean).join(" · "),
      target: { kind: "event", id: e.id },
    }),
  );
  add(
    data.coupons,
    (c) => searchable([c.reference, c.code, c.productName, c.buyer.name, c.buyer.email, c.recipientName, c.recipientEmail]),
    (c) => ({
      key: `coupon-${c.id}`,
      group: "kuponai",
      title: c.productName,
      subtitle: [c.reference, c.buyer.name].filter(Boolean).join(" · "),
      target: { kind: "coupon", id: c.id },
    }),
  );
  add(
    data.inquiries,
    (q) => searchable([q.customer.name, q.customer.email, q.eventType, q.space], [q.customer.phone]),
    (q) => ({
      key: `inquiry-${q.id}`,
      group: "uzklausos",
      title: q.customer.name,
      subtitle: [q.eventType, formatDay(q.date)].join(" · "),
      target: { kind: "link", href: "/admin/uzklausos" },
    }),
  );

  const order = new Map<SearchGroup, number>(SEARCH_GROUPS.map((g, i) => [g.id, i]));
  return hits.sort((a, b) => (order.get(a.group) ?? 0) - (order.get(b.group) ?? 0));
}
