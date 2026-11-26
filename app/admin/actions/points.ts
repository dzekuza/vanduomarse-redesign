"use server";

import { z } from "zod";
import { DEFAULT_LOYALTY, adjustPointsSchema, loyaltySettingsSchema, type LoyaltySettings, type PointsEntry } from "@/lib/points";
import { dbError, done, fail, staffClient, type ActionResult } from "@/lib/admin/action-helpers";

// ---------------------------------------------------------------------------
// Points / kreditai (ADR-0121). Balances live on riders (Klientai); every change goes through the database function
// adjust_rider_points / private.apply_points, which checks the klientai permission, locks the balance and writes the ledger.
// ---------------------------------------------------------------------------

const riderIdSchema = z.uuid();

const POINTS_ERRORS: Record<string, string> = {
  points_insufficient: "Klientas neturi tiek taškų.",
  points_invalid: "Netinkamas taškų kiekis.",
  points_reason: "Nurodykite priežastį.",
  points_no_rider: "Klientas nerastas.",
  forbidden: "Neturite teisės šiam veiksmui.",
};

/** Staff give (positive) or take away (negative) points; the reason is kept in the log. Returns the new balance. */
export async function adjustRiderPoints(riderId: string, delta: number, reason: string): Promise<ActionResult<{ balance: number }>> {
  const ctx = await staffClient("klientai");
  if (!ctx.ok) return ctx.error;
  const parsed = adjustPointsSchema.safeParse({ delta, reason });
  if (!parsed.success || !riderIdSchema.safeParse(riderId).success) return fail("Netinkamos reikšmės.", "invalid");
  const { data, error } = await ctx.supabase.rpc("adjust_rider_points", { p_rider: riderId, p_delta: parsed.data.delta, p_reason: parsed.data.reason });
  if (error) return POINTS_ERRORS[error.hint ?? ""] ? fail(POINTS_ERRORS[error.hint ?? ""], error.hint ?? undefined) : dbError(error);
  return done({ balance: data });
}

/** The latest movements of one customer's balance, newest first. Loaded when the Taškai tab opens, not with the admin data. */
export async function loadRiderPoints(riderId: string): Promise<ActionResult<PointsEntry[]>> {
  const ctx = await staffClient("klientai");
  if (!ctx.ok) return ctx.error;
  if (!riderIdSchema.safeParse(riderId).success) return fail("Netinkamos reikšmės.", "invalid");
  const { data, error } = await ctx.supabase
    .from("points_ledger")
    .select("delta, kind, reason, created_at")
    .eq("rider_id", riderId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return dbError(error);
  return { data: data.map((row) => ({ delta: row.delta, kind: row.kind, reason: row.reason, at: row.created_at })) };
}

/** The points settings (owners). Falls back to the defaults when the table is not there yet. */
export async function loadLoyaltySettings(): Promise<ActionResult<LoyaltySettings>> {
  const ctx = await staffClient("owner");
  if (!ctx.ok) return ctx.error;
  const { data, error } = await ctx.supabase.from("loyalty_settings").select("enabled, earn_points_per_euro, point_value_eur").maybeSingle();
  // A failed read must not look like the defaults (the owner could then save over the real values); only a missing row does.
  if (error) return dbError(error);
  if (!data) return { data: DEFAULT_LOYALTY };
  return { data: { enabled: data.enabled, earnPointsPerEuro: Number(data.earn_points_per_euro), pointValueEur: Number(data.point_value_eur) } };
}

export async function saveLoyaltySettings(settings: LoyaltySettings): Promise<ActionResult<LoyaltySettings>> {
  const ctx = await staffClient("owner");
  if (!ctx.ok) return ctx.error;
  const parsed = loyaltySettingsSchema.safeParse(settings);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  // Stored with the database's precision, and shown back the same way: 2 decimals for points per euro, 4 for a point's value.
  const v = { enabled: parsed.data.enabled, earnPointsPerEuro: Math.round(parsed.data.earnPointsPerEuro * 100) / 100, pointValueEur: Math.round(parsed.data.pointValueEur * 10000) / 10000 };
  if (v.pointValueEur <= 0) return fail("Taško vertė per maža.", "invalid");
  const { error } = await ctx.supabase
    .from("loyalty_settings")
    .update({ enabled: v.enabled, earn_points_per_euro: v.earnPointsPerEuro, point_value_eur: v.pointValueEur })
    .eq("id", true);
  if (error) return dbError(error);
  return done(v);
}
