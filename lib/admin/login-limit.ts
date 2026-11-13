import "server-only";
import { clientIp } from "@/lib/client-ip";
import { hashIp, hashLoginEmail } from "@/lib/phone-verification";
import { createAdminClient } from "@/lib/supabase/admin";

/** Seconds to ask the person to wait when the limiter itself is down. */
const UNAVAILABLE_RETRY = 60;

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
 * Per-IP and per-e-mail limit for the /admin sign-in (migrations `admin_login_limits`, `admin_login_atomic`): failed password and
 * code checks 10 per IP and 5 per e-mail in 15 minutes, e-mail code requests 10 and 5 per hour. Only hashes are stored.
 * The check counts the try in the same locked step, so parallel guesses cannot all pass; `record(true)` forgets that IP + e-mail
 * pair's failures. Fails closed: if the limiter cannot answer (missing secret or service key, database error) the sign-in is
 * refused for a minute instead of running unlimited.
 */
export async function guardLogin(email: string, kind: LoginKind): Promise<LoginGuard> {
  let ipHash: string;
  let emailHash: string;
  let admin: ReturnType<typeof createAdminClient>;
  try {
    ipHash = hashIp(await clientIp());
    emailHash = hashLoginEmail(email);
    admin = createAdminClient();
  } catch (e) {
    console.error("Admin login limit unavailable", e);
    return { retryAfter: UNAVAILABLE_RETRY, record: async () => {} };
  }
  const { data, error } = await admin.rpc("admin_login_check", { p_ip_hash: ipHash, p_email_hash: emailHash, p_kind: kind });
  const row = data?.[0];
  if (error || !row) {
    console.error("admin_login_check failed", error?.message ?? "no answer");
    return { retryAfter: UNAVAILABLE_RETRY, record: async () => {} };
  }
  return {
    retryAfter: row.allowed ? null : row.retry_after,
    record: async (ok) => {
      const { error: recordError } = await admin.rpc("admin_login_record", { p_ip_hash: ipHash, p_email_hash: emailHash, p_kind: kind, p_ok: ok });
      if (recordError) console.error("admin_login_record failed", recordError.message);
    },
  };
}
