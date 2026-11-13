import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export const PHONE_REQUIRED = { error: { message: "Atsiskaitymui vietoje patvirtinkite telefono numerį SMS kodu.", code: "phone_required" } } as const;

/**
 * A "pay on site" request from an account with a confirmed phone is confirmed right away; the database
 * checks the owner, the phone and that the request is still pending and unpaid. True when it was confirmed.
 */
export async function confirmCashRequest(supabase: SupabaseClient<Database>, reference: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("confirm_cash_request", { p_reference: reference });
  return !error && data === true;
}
