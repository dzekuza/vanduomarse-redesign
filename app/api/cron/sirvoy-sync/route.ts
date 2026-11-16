import { timingSafeEqual } from "node:crypto";
import { syncExternalCalendars } from "@/lib/external-sync";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Constant-time comparison of the bearer token with the secret. */
function authorized(header: string | null, secret: string): boolean {
  const given = Buffer.from(header ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Vercel Cron (vercel.json, every 15 minutes) reads each room's Sirvoy iCal feed into the stay stock,
 * so a night sold on Booking.com blocks the same cabin here. Vercel sends `Authorization: Bearer
 * $CRON_SECRET`; without the secret set the route stays closed.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response("Sync is not configured", { status: 503 });
  if (!authorized(request.headers.get("authorization"), secret)) return new Response("Unauthorized", { status: 401 });

  try {
    const { synced, failed } = await syncExternalCalendars();
    return Response.json({ synced, failed });
  } catch (e) {
    console.error("Sirvoy sync failed", e);
    return new Response("Sync failed", { status: 500 });
  }
}
