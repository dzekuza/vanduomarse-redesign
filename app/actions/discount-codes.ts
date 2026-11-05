"use server";

import type { ActionResult } from "@/app/admin/actions";
import { DISCOUNT_CODE_MAX, DISCOUNT_CODE_MIN, isDiscountService, normalizeDiscountCode, type CheckedDiscount } from "@/lib/discount-codes";
import { createPublicClient } from "@/lib/supabase/public";

const fail = (message: string, code?: string): { error: { message: string; code?: string } } => ({ error: { message, code } });

/**
 * The checkout's live check of a discount code. It only previews the discount: every booking
 * RPC validates the code again and computes the amount itself (ADR-0036).
 */
export async function checkDiscountCode(code: string): Promise<ActionResult<CheckedDiscount>> {
  const normalized = normalizeDiscountCode(typeof code === "string" ? code : "");
  if (normalized.length < DISCOUNT_CODE_MIN || normalized.length > DISCOUNT_CODE_MAX) return fail("Įveskite nuolaidos kodą.", "format");

  const { data, error } = await createPublicClient().rpc("check_discount_code", { p_code: normalized });
  if (error) return fail("Nepavyko patikrinti kodo. Bandykite dar kartą.", "db");
  const row = data[0];
  if (!row) return fail("Toks galiojantis nuolaidos kodas nerastas.", "not_found");
  return { data: { code: row.code, kind: row.kind, value: Number(row.value), services: row.services.filter(isDiscountService) } };
}
