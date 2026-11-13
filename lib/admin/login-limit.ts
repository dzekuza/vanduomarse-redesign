import "server-only";
import { clientIp } from "@/lib/client-ip";
import { hashIp, hashLoginEmail } from "@/lib/phone-verification";
import { createAdminClient } from "@/lib/supabase/admin";

export type LoginKind = "password" | "code_send" | "code_verify";

export interface LoginGuard {
  /** Seconds to wait when this IP or e-mail is over its limit, else null. */
  retryAfter: number | null;
  /** Writes the attempt down; call it once, after Supabase Auth has answered. */
  record: (ok: boolean) => Promise<void>;
}

/** "Per daug bandymų. Bandykite po 12 min." */
export const tooManyAttempts = (seconds: number) =>
  `Per daug bandymų. Bandykite po ${seconds >= 120 ? `${Math.ceil(seconds / 60)} min.` : `${Math.max(seconds, 1)} s.`}`;

/**
 * Per-IP and per-e-mail limit for the /admin sign-in (migration `admin_login_limits`): failed password and
 * code checks 10 per IP and 5 per e-mail in 15 minutes, e-mail code requests 10 and 5 per hour. Only hashes are
 * stored. If the limiter itself is unavailable the sign-in stays open (logged), because Supabase Auth's own
 * per-IP limits still apply and a missing secret must not lock the owners out.
 */
export async function guardLogin(email: string, kind: LoginKind): Promise<LoginGuard> {
  let ipHash: string;
  let emailHash: string;
  try {
    ipHash = hashIp(await clientIp());
    emailHash = hashLoginEmail(email);
  } catch (e) {
    console.error("Admin login limit unavailable", e);
    return { retryAfter: null, record: async () => {} };
  }
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("admin_login_check", { p_ip_hash: ipHash, p_email_hash: emailHash, p_kind: kind });
  if (error) console.error("admin_login_check failed", error.message);
  const row = data?.[0];
  return {
    retryAfter: row && !row.allowed ? row.retry_after : null,
    record: async (ok) => {
      const { error: recordError } = await admin.rpc("admin_login_record", { p_ip_hash: ipHash, p_email_hash: emailHash, p_kind: kind, p_ok: ok });
      if (recordError) console.error("admin_login_record failed", recordError.message);
    },
  };
}
