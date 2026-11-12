import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Supabase client for Client Components. It reads the same session cookies as the server client, so it acts as the
 * signed-in user (RLS applies). Used for Realtime subscriptions only: every read and write still goes through server
 * components and server actions.
 */
export function createClient() {
  const { url, anonKey } = supabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}
