import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Service-role client, used only by the owner-only staff actions to create,
 * reset and delete logins (the auth admin API has no row level security to
 * lean on), and by the phone gate to call request_phone_code/verify_phone_code,
 * which anon may not run. It bypasses RLS entirely, so it must never touch data
 * tables, never reach the browser, and staff callers check the owner role first.
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
