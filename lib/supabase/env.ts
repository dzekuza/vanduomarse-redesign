/**
 * Public Supabase settings. Both are safe in the browser bundle; the
 * service-role key is not read here: only the owner-only staff actions use it,
 * through `lib/supabase/admin.ts` (RLS + roles cover every other read and write).
 */
export function supabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — see .env.example.");
  }
  return { url, anonKey };
}
