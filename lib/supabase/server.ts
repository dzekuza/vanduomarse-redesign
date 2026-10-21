import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

export type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Per-request Supabase client for Server Components, Server Actions and Route
 * Handlers. Acts as the signed-in user (or anon), so RLS applies.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = supabaseEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component: cookies are read-only there, and
          // proxy.ts already refreshed the session for this request.
        }
      },
    },
  });
}
