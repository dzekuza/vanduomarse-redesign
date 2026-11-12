import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Service-role client, used only by the owner-only staff actions to create,
 * reset and delete logins (the auth admin API has no row level security to
 * lean on), and by the phone gate to call request_phone_code, verify_phone_code
 * and cancel_phone_code, which anon may not run, and by the Stripe payment code
 * (start_payment, complete_payment and the other payment functions, also closed to
 * anon), by the coupon order action (create_coupon_order, closed to anon so the per-IP key cannot be forged), and by booking notifications (account_notify_email, payment_notify_email: a
 * confirmed account email, ADR-0028). It bypasses RLS entirely, so callers must never query or write tables with
 * it directly (those scoped functions are the only data access), it never reaches
 * the browser, and staff callers check the owner role first.
 */
export function createAdminClient() {
  const { url } = supabaseEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new MissingServiceKeyError();
  return createClient<Database>(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export class MissingServiceKeyError extends Error {
  constructor() {
    super("Missing SUPABASE_SERVICE_ROLE_KEY — see .env.example.");
  }
}
