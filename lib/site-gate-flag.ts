import { supabaseEnv } from "@/lib/supabase/env";

/**
 * Whether the "coming soon" gate is on. The switch lives in `site_settings.coming_soon` (owners flip it at
 * /admin/svetaine); the proxy asks for it as an anonymous visitor. The answer is kept in memory for a few
 * seconds per server instance so the gate does not cost a database call on every request. If the database
 * cannot be reached, SITE_GATE=1 decides (the old env switch), so an outage never silently opens or closes the site.
 */
const TTL_MS = 5_000;
const TIMEOUT_MS = 2_000;

let cached: { on: boolean; at: number } | null = null;

const envFallback = () => process.env.SITE_GATE?.trim() === "1";

async function readFlag(): Promise<boolean> {
  try {
    const { url, anonKey } = supabaseEnv();
    const response = await fetch(`${url}/rest/v1/site_settings?select=coming_soon&limit=1`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return envFallback();
    const rows: unknown = await response.json();
    const first = Array.isArray(rows) ? (rows[0] as { coming_soon?: unknown } | undefined) : undefined;
    return typeof first?.coming_soon === "boolean" ? first.coming_soon : envFallback();
  } catch {
    return envFallback();
  }
}

export async function siteGateOn(): Promise<boolean> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.on;
  const on = await readFlag();
  cached = { on, at: Date.now() };
  return on;
}

/** Called after an owner flips the switch so this instance answers with the new value at once. */
export function forgetSiteGate(): void {
  cached = null;
}
