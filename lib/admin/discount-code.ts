import "server-only";
import { discountFor, isDiscountService, normalizeDiscountCode, type DiscountService } from "@/lib/discount-codes";
import { todayKey } from "@/lib/sauna";
import { createAdminClient } from "@/lib/supabase/admin";

/** A validated discount code, ready to store on the row it discounts. */
export type AppliedDiscount = { id: string; code: string; amount: number };

export type DiscountOutcome = { ok: true; applied: AppliedDiscount | null } | { ok: false; message: string };

type AdminClient = ReturnType<typeof createAdminClient>;

/** A table a code can be applied to, and the status value that means "cancelled, does not count" on it (`private.discount_code_uses`). */
const USE_SOURCES = [
  { table: "bookings", cancelled: "atsaukta" },
  { table: "quad_rentals", cancelled: "atsaukta" },
  { table: "event_tickets", cancelled: "atsaukta" },
  { table: "coupons", cancelled: "atsauktas" },
  { table: "rider_plan_orders", cancelled: "atsauktas" },
  { table: "plan_passes", cancelled: "atsauktas" },
] as const;

/** Mirrors `private.discount_code_uses`: every live request holding the code, across all six tables it can land on. Null when a count could not be read, so the caller fails closed instead of under-counting. */
async function discountCodeUses(admin: AdminClient, codeId: string): Promise<number | null> {
  const counts = await Promise.all(USE_SOURCES.map(({ table, cancelled }) => admin.from(table).select("id", { count: "exact", head: true }).eq("discount_code_id", codeId).neq("status", cancelled)));
  if (counts.some((c) => c.error)) return null;
  return counts.reduce((sum, c) => sum + (c.count ?? 0), 0);
}

/**
 * Validates a staff-entered discount code the same way `private.apply_discount_code` does for the public
 * booking RPCs (ADR-0036) — active, covers `service`, within its date range, under its use limit — then
 * prices it off `subtotal`. A staff session has no grant on that function (revoked from `authenticated`),
 * so this reads the table itself with the service-role client instead. Returns `applied: null` for an
 * empty code, never a failure.
 *
 * Not transactional: the use count is read, then (moments later) the caller inserts its own row holding
 * the code. A code at its very last use, applied by two requests at almost the same instant, could land
 * both — the same gap every `max_uses` check here has, since staff bookings bypass the row-locking public
 * RPCs entirely. Low-volume phone/walk-in traffic, so accepted rather than adding a dedicated RPC for it.
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
    const uses = await discountCodeUses(admin, data.id);
    if (uses === null) return { ok: false, message: "Nepavyko patikrinti nuolaidos kodo." };
    if (uses >= data.max_uses) return { ok: false, message: "Nuolaidos kodas jau išnaudotas." };
  }

  const amount = discountFor({ kind: data.kind, value: Number(data.value), services }, service, subtotal);
  return { ok: true, applied: { id: data.id, code: data.code, amount } };
}
