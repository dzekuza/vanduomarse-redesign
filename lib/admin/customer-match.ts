import type { Rider } from "@/lib/admin/types";

/** The phone as digits in the form the database compares (`private.norm_phone`): 370…, so "8 612 34567", "+370 612 34567" and "61234567" agree. */
export function normPhone(value: string): string {
  let v = value.replace(/\D/g, "");
  if (v.startsWith("00")) v = v.slice(2);
  if (v.startsWith("370")) return v;
  if (v.startsWith("8") && v.length === 9) return `370${v.slice(1)}`;
  if (v.length === 8) return `370${v}`;
  return v;
}

/** The customer (Klientai) an order belongs to, by phone or e-mail; undefined when none matches. */
export type CustomerLookup = (contact: { phone?: string | null; email?: string | null }) => string | undefined;

/**
 * Orders carry a stored `riderId` only when they were linked (a one-time backfill, ADR-0042); orders placed since are
 * not. This finds the customer from the order's contact the same way the database does now (`private.find_rider`: phone,
 * then e-mail; a registered customer first, then the oldest), so a customer's name can link to their page and their Pirkimai
 * tab lists every order. New orders are linked in the database (ADR-0083); this covers the few that are not.
 */
export function makeCustomerLookup(riders: readonly Pick<Rider, "id" | "phone" | "phone2" | "email" | "createdAt" | "avatarPath">[]): CustomerLookup {
  const byPhone = new Map<string, string>();
  const byEmail = new Map<string, string>();
  // A customer who finished registering (has a photo) first, then the oldest: the same order as `private.find_rider`.
  const ordered = [...riders].sort((a, b) => Number(Boolean(b.avatarPath)) - Number(Boolean(a.avatarPath)) || a.createdAt.localeCompare(b.createdAt));
  for (const r of ordered) {
    for (const phone of [r.phone, r.phone2]) {
      const n = phone ? normPhone(phone) : "";
      if (n && !byPhone.has(n)) byPhone.set(n, r.id);
    }
    const email = r.email?.trim().toLowerCase();
    if (email && !byEmail.has(email)) byEmail.set(email, r.id);
  }
  return ({ phone, email }) => {
    const n = phone ? normPhone(phone) : "";
    const e = email?.trim().toLowerCase();
    return (n ? byPhone.get(n) : undefined) ?? (e ? byEmail.get(e) : undefined);
  };
}
