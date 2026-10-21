import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Anonymous, cookieless client for the public pages: reads the catalogue and
 * calls the availability functions. Never sees customer data (RLS + grants).
 */
export function createPublicClient() {
  const { url, anonKey } = supabaseEnv();
  return createClient<Database>(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
