import "server-only";
import { createHash } from "node:crypto";
import { PIXEL_ID } from "@/lib/consent";
import { toE164 } from "@/lib/sms/twilio";

/**
 * Meta Conversions API: the server-side copy of the Pixel's standard events (ADR-0107).
 *
 * Each event carries the same `event_id` as the browser Pixel event, so Meta keeps one of the two. Personal fields are
 * normalised and SHA-256 hashed here, as Meta requires; IP, user agent and the `_fbp` / `_fbc` cookies are sent as they
 * are. Nothing is sent without a Pixel id and `META_CAPI_ACCESS_TOKEN` (server only, never `NEXT_PUBLIC_`).
 */

export const META_GRAPH_VERSION = "v26.0";

export const CAPI_EVENTS = ["ViewContent", "Lead", "InitiateCheckout", "CompleteRegistration", "Purchase"] as const;
export type CapiEventName = (typeof CAPI_EVENTS)[number];

/** Who did it, as far as the server knows. Every field is optional; Meta matches on whatever it gets. */
export interface CapiUser {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  externalId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
}

export interface CapiCustomData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  coupon?: string;
}

export interface CapiEvent {
  name: CapiEventName;
  eventId: string;
  sourceUrl: string;
  /** Seconds since the epoch. */
  time: number;
  user: CapiUser;
  custom?: CapiCustomData;
}

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/** Meta's normalisation before hashing: trimmed lowercase e-mail; phone digits with the country code (a Lithuanian 8… number becomes 370…); names lowercase without punctuation. */
export function normalizeEmail(email: string): string | null {
  const v = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null;
}

/** The site's one phone rule (`toE164`, which mirrors `private.norm_phone`), without the "+" that Meta does not want. */
export function normalizePhone(phone: string): string | null {
  return toE164(phone)?.slice(1) ?? null;
}

export function normalizeName(name: string): string | null {
  const v = name.trim().toLowerCase().replace(/[^\p{L}\p{M}]/gu, "");
  return v || null;
}

const hashed = (value: string | null | undefined, normalize: (v: string) => string | null) => {
  const v = value ? normalize(value) : null;
  return v ? [sha256(v)] : undefined;
};

/** The `user_data` block Meta expects: hashed personal fields, plain technical ones, country always Lithuania. */
export function buildUserData(user: CapiUser): Record<string, string | string[]> {
  const data: Record<string, string | string[] | undefined> = {
    em: hashed(user.email, normalizeEmail),
    ph: hashed(user.phone, normalizePhone),
    fn: hashed(user.firstName, normalizeName),
    ln: hashed(user.lastName, normalizeName),
    external_id: hashed(user.externalId, (v) => v.trim() || null),
    country: [sha256("lt")],
    client_ip_address: user.ip ?? undefined,
    client_user_agent: user.userAgent ?? undefined,
    fbp: user.fbp ?? undefined,
    fbc: user.fbc ?? undefined,
  };
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)) as Record<string, string | string[]>;
}

/** One event in Meta's request format. `action_source` is always `website`. */
export function buildCapiPayload(event: CapiEvent) {
  return {
    event_name: event.name,
    event_time: event.time,
    event_id: event.eventId,
    event_source_url: event.sourceUrl,
    action_source: "website",
    user_data: buildUserData(event.user),
    ...(event.custom && Object.keys(event.custom).length ? { custom_data: event.custom } : {}),
  };
}

/** True when the Conversions API is configured on this server. */
export function capiConfigured(): boolean {
  return Boolean(PIXEL_ID && process.env.META_CAPI_ACCESS_TOKEN);
}

/**
 * Sends one event. Never throws: a failed or unconfigured send is logged (without personal data) and dropped, so
 * tracking can never break a page or a booking.
 */
export async function sendCapiEvent(event: CapiEvent): Promise<void> {
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!PIXEL_ID || !token) return;
  // The test code is for local development only: on the live site it would send every event to Test events instead of real data.
  const testCode = new URL(event.sourceUrl).hostname === "localhost" ? process.env.META_CAPI_TEST_EVENT_CODE?.trim() : undefined;
  const body = { data: [buildCapiPayload(event)], ...(testCode ? { test_event_code: testCode } : {}) };
  try {
    // The token goes in the Authorization header, never in the URL (URLs end up in logs).
    const res = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${PIXEL_ID}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`Meta CAPI ${event.name} rejected (${res.status}): ${detail.slice(0, 300)}`);
    }
  } catch (e) {
    console.error(`Meta CAPI ${event.name} failed:`, e instanceof Error ? e.message : e);
  }
}
