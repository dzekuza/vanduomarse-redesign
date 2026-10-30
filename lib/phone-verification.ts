import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { toE164 } from "@/lib/sms/twilio";

/**
 * SMS phone verification, server side. A 6-digit code is stored only as an
 * HMAC; once the visitor types it back they get a signed token for that phone
 * (sent with every booking action, so it works inside third-party iframes where
 * cookies are blocked). Needs PHONE_VERIFICATION_SECRET (32+ characters).
 */

/** How long a verified phone stays verified; the database allows 65 minutes. */
export const TOKEN_TTL_MS = 60 * 60 * 1000;
export const CODE_LENGTH = 6;

export class MissingVerificationSecretError extends Error {
  constructor() {
    super("Missing PHONE_VERIFICATION_SECRET (32+ characters) — see .env.example.");
  }
}

/** One key per purpose, derived from the one secret. */
function key(purpose: "code" | "token" | "ip"): Buffer {
  const secret = process.env.PHONE_VERIFICATION_SECRET;
  if (!secret || secret.length < 32) throw new MissingVerificationSecretError();
  return createHmac("sha256", secret).update(`vanduomarse:${purpose}`).digest();
}

const hmac = (purpose: "code" | "token" | "ip", value: string) => createHmac("sha256", key(purpose)).update(value).digest("base64url");

export const newCode = () => String(randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, "0");

/** Bound to the phone, so a code for one number never verifies another. */
export const hashCode = (phone: string, code: string) => hmac("code", `${phone}:${code}`);

/** IPs are only kept hashed, for the per-IP send limit. */
export const hashIp = (ip: string) => hmac("ip", ip);

interface TokenPayload {
  /** E.164 phone. */
  p: string;
  /** Expiry, ms since epoch. */
  e: number;
}

/** "v1.<payload>.<signature>", base64url. */
export function signToken(phone: string, now = Date.now()): { token: string; expiresAt: number } {
  const payload: TokenPayload = { p: phone, e: now + TOKEN_TTL_MS };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { token: `v1.${body}.${hmac("token", body)}`, expiresAt: payload.e };
}

/** The verified E.164 phone, or null for a missing, forged or expired token. */
export function readToken(token: string | null | undefined, now = Date.now()): string | null {
  const [version, body, signature] = (token ?? "").split(".");
  if (version !== "v1" || !body || !signature) return null;
  const expected = Buffer.from(hmac("token", body));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as Partial<TokenPayload>;
    if (typeof payload.p !== "string" || typeof payload.e !== "number" || payload.e <= now) return null;
    return payload.p;
  } catch {
    return null;
  }
}

/** What a public action answers when the token is missing, expired or for another number. */
export const UNVERIFIED = { error: { message: "Patvirtinkite telefono numerį SMS kodu dar kartą.", code: "phone_unverified" } };

/**
 * The booking's phone must be the one the token verified. Returns that phone in
 * E.164 (what the database stores) or null when the visitor has to verify again.
 */
export function verifiedPhone(token: string | null | undefined, typedPhone: string | null | undefined): string | null {
  let verified: string | null;
  try {
    verified = readToken(token);
  } catch (e) {
    if (!(e instanceof MissingVerificationSecretError)) throw e;
    console.error(`Phone verification: ${e.message}`);
    return null;
  }
  const typed = toE164(typedPhone);
  return verified && typed && verified === typed ? verified : null;
}
