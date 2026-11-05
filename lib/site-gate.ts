/**
 * "Coming soon" gate for the whole public site. On when SITE_GATE=1 (read per request; on Vercel an
 * env change still needs a redeploy). /admin, /api and static files are never gated (proxy.ts matcher).
 * With SITE_GATE_CODE set, the gate page shows a code field; the right code sets GATE_COOKIE and the
 * proxy lets that browser through. Changing the code signs every browser out of the preview.
 */
export const GATE_PATH = "/netrukus";
export const GATE_COOKIE = "vm_gate_pass";
export const GATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export const siteGateOn = () => process.env.SITE_GATE?.trim() === "1";
export const gateCode = () => process.env.SITE_GATE_CODE?.trim() ?? "";

/** Paths that stay open while the gate is on: staff dashboard and the gate page itself. */
export function gateExempt(pathname: string): boolean {
  return pathname === GATE_PATH || pathname === "/admin" || pathname.startsWith("/admin/");
}

/** Cookie value for a code: SHA-256 hex, so the cookie never holds the code itself. Web Crypto works in the proxy and in Node. */
export async function gatePassToken(code: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`vanduo-marse-gate:${code}`));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time comparison of two equal-format strings. */
export function sameToken(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** True when the request's cookie matches the current SITE_GATE_CODE. */
export async function hasGatePass(cookie: string | undefined): Promise<boolean> {
  const code = gateCode();
  if (!code || !cookie) return false;
  return sameToken(cookie, await gatePassToken(code));
}
