"use server";

import { dbError, done, fail, staffClient, type ActionResult } from "@/lib/admin/action-helpers";
import { forgetSiteGate } from "@/lib/site-gate-flag";

/**
 * /admin/svetaine writes: site-wide switches. Owner-only (RLS enforces the same).
 * `done` revalidates the admin layout so the store resets to what the database holds.
 */

/** Turns the public "coming soon" page on or off. The proxy picks the change up within a few seconds. */
export async function setComingSoon(enabled: boolean): Promise<ActionResult> {
  const ctx = await staffClient("owner");
  if (!ctx.ok) return ctx.error;
  if (typeof enabled !== "boolean") return fail("Netinkamos reikšmės.", "invalid");
  const { data, error } = await ctx.supabase.from("site_settings").update({ coming_soon: enabled }).eq("id", true).select("id");
  if (error) return dbError(error);
  if (!data?.length) return fail("Nustatymo išsaugoti nepavyko. Patikrinkite, ar pritaikyta duomenų bazės migracija.", "missing");
  forgetSiteGate();
  return done(null);
}
