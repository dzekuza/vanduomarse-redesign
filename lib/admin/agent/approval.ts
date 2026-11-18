import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * A change the assistant proposes is signed with the staff member's id, the tool and its exact arguments, and an expiry.
 * The approve request carries only that token, so the browser cannot approve anything the server did not propose, for
 * another staff member, or with edited arguments. Each token also runs once per server instance (best effort: separate
 * serverless instances do not share the list, so the staff-only route stays the real boundary).
 */
const TTL_MS = 15 * 60_000;
const used = new Map<string, number>();

interface Payload {
  u: string;
  n: string;
  a: Record<string, unknown>;
  e: number;
}

function key(): Buffer | null {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return secret ? createHmac("sha256", "agent-approval").update(secret).digest() : null;
}

const sign = (body: string, k: Buffer) => createHmac("sha256", k).update(body).digest("base64url");

export function signApproval(userId: string, name: string, args: Record<string, unknown>): string | null {
  const k = key();
  if (!k) return null;
  const body = Buffer.from(JSON.stringify({ u: userId, n: name, a: args, e: Date.now() + TTL_MS } satisfies Payload)).toString("base64url");
  return `${body}.${sign(body, k)}`;
}

/** The proposal behind a token for this staff member, or why it cannot run. */
export function openApproval(token: string, userId: string): { name: string; args: Record<string, unknown> } | { error: string } {
  const k = key();
  const [body, sig] = token.split(".");
  if (!k || !body || !sig) return { error: "Neteisingas patvirtinimas." };
  const expected = Buffer.from(sign(body, k));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { error: "Neteisingas patvirtinimas." };
  let payload: Payload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString()) as Payload;
  } catch {
    return { error: "Neteisingas patvirtinimas." };
  }
  if (payload.u !== userId) return { error: "Šis veiksmas pasiūlytas kitam darbuotojui." };
  const now = Date.now();
  if (payload.e < now) return { error: "Patvirtinimo laikas baigėsi. Paprašykite asistento pasiūlyti veiksmą iš naujo." };
  for (const [id, expires] of used) if (expires < now) used.delete(id);
  if (used.has(sig)) return { error: "Šis veiksmas jau įvykdytas." };
  used.set(sig, payload.e);
  return { name: payload.n, args: payload.a };
}

/** Frees a token again when the change failed, so the staff member can retry it. */
export function releaseApproval(token: string): void {
  used.delete(token.split(".")[1] ?? "");
}

const hits = new Map<string, number[]>();

/** At most `max` calls per minute per staff member (best effort per instance). */
export function overRateLimit(userId: string, max = 20): boolean {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(userId, recent);
  return recent.length > max;
}
