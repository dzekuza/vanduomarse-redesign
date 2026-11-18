import "server-only";
import { discountFor, isDiscountService, normalizeDiscountCode, type DiscountService } from "@/lib/discount-codes";
import { todayKey } from "@/lib/sauna";
import { createAdminClient } from "@/lib/supabase/admin";

/** A validated discount code, ready to store on the row it discounts. */
export type AppliedDiscount = { id: string; code: string; amount: number };

export type DiscountOutcome = { ok: true; applied: AppliedDiscount | null } | { ok: false; message: string };

/**
 * Validates a staff-entered discount code the same way `private.apply_discount_code` does for the public
 * booking RPCs (ADR-0036) — active, covers `service`, within its date range, under its use limit — then
 * prices it off `subtotal`. A staff session has no grant on that function (revoked from `authenticated`),
 * so this reads the table itself with the service-role client instead. Returns `applied: null` for an
 * empty code, never a failure.
 */
export async function applyStaffDiscountCode(code: string, service: DiscountService, subtotal: number): Promise<DiscountOutcome> {
  const normalized = normalizeDiscountCode(code);
  if (!normalized) return { ok: true, applied: null };

  const admin = createAdminClient();
  const { data, error } = await admin.from("discount_codes").select("id, code, kind, value, services, active, valid_from, valid_until, max_uses").eq("code", normalized).maybeSingle();
  if (error) return { ok: false, message: "Nepavyko patikrinti nuolaidos kodo." };
  const today = todayKey();
  const services = (data?.services ?? []).filter(isDiscountService);
  if (!data || !data.active || !services.includes(service) || (data.valid_from && today < data.valid_from) || (data.valid_until && today > data.valid_until)) {
    return { ok: false, message: "Toks galiojantis nuolaidos kodas nerastas." };
  }
  if (data.max_uses !== null) {
    const [{ count: bookings }, { count: rentals }, { count: tickets }] = await Promise.all([
      admin.from("bookings").select("id", { count: "exact", head: true }).eq("discount_code_id", data.id).neq("status", "atsaukta"),
      admin.from("quad_rentals").select("id", { count: "exact", head: true }).eq("discount_code_id", data.id).neq("status", "atsaukta"),
      admin.from("event_tickets").select("id", { count: "exact", head: true }).eq("discount_code_id", data.id).neq("status", "atsaukta"),
    ]);
    if ((bookings ?? 0) + (rentals ?? 0) + (tickets ?? 0) >= data.max_uses) return { ok: false, message: "Nuolaidos kodas jau išnaudotas." };
  }

  const amount = discountFor({ kind: data.kind, value: Number(data.value), services }, service, subtotal);
  return { ok: true, applied: { id: data.id, code: data.code, amount } };
}
