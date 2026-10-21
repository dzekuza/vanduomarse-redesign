/**
 * Public Supabase settings. Both are safe in the browser bundle; the
 * service-role key is deliberately not read anywhere in the app (RLS + staff
 * login cover every read and write).
 */
export function supabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — see .env.example.");
  }
  return { url, anonKey };
}
