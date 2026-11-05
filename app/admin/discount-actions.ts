"use server";

import { z } from "zod";
import { dbError, done, fail, staffClient, type ActionResult } from "@/lib/admin/action-helpers";
import { discountCodeInput, type DiscountCodeInput } from "@/lib/discount-code-schema";

/**
 * /admin/nuolaidos writes, behind the `nuolaidos` page permission (RLS enforces the same).
 * `done` revalidates the admin layout so the store resets to what the database holds.
 */

const DUPLICATE = "Toks kodas jau yra.";

export async function saveDiscountCode(input: DiscountCodeInput): Promise<ActionResult> {
  const ctx = await staffClient("nuolaidos");
  if (!ctx.ok) return ctx.error;
  const parsed = discountCodeInput.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Netinkamos reikšmės.", "invalid");
  const v = parsed.data;
  const row = {
    code: v.code,
    kind: v.kind,
    value: v.value,
    services: v.services,
    valid_from: v.validFrom,
    valid_until: v.validUntil,
    max_uses: v.maxUses,
    active: v.active,
    note: v.note || null,
  };
  const { error } = v.id
    ? await ctx.supabase.from("discount_codes").update(row).eq("id", v.id)
    : await ctx.supabase.from("discount_codes").insert(row);
  if (error?.code === "23505") return fail(DUPLICATE, "duplicate");
  return error ? dbError(error) : done(null);
}

export async function setDiscountCodeActive(id: string, active: boolean): Promise<ActionResult> {
  const ctx = await staffClient("nuolaidos");
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success || typeof active !== "boolean") return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("discount_codes").update({ active }).eq("id", id);
  return error ? dbError(error) : done(null);
}

/** Requests that used the code keep its text and amount (the link is set to null). */
export async function deleteDiscountCode(id: string): Promise<ActionResult> {
  const ctx = await staffClient("nuolaidos");
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("discount_codes").delete().eq("id", id);
  return error ? dbError(error) : done(null);
}
