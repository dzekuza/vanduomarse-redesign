"use server";

import { z } from "zod";
import { dbError, done, fail, staffClient, type ActionResult } from "@/lib/admin/action-helpers";
import { syncExternalCalendars } from "@/lib/external-sync";
import { SIRVOY_FEED_URL } from "@/lib/ical";
import { MissingServiceKeyError } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site";

const calendarIdSchema = z.string().uuid();
/** An empty address clears the room's feed. */
const feedInput = z.union([z.literal(""), z.string().trim().regex(SIRVOY_FEED_URL)]);

/**
 * Owner-only. Stores (or, with an empty address, removes) the Sirvoy iCal export of one room through
 * set_external_feed, then reads that feed right away so the owner sees it work. A failed first read is not an
 * error here: it is kept on the room as its last error.
 */
export async function saveExternalFeed(calendarId: string, url: string): Promise<ActionResult> {
  const ctx = await staffClient("owner");
  if (!ctx.ok) return ctx.error;
  const id = calendarIdSchema.safeParse(calendarId);
  const address = feedInput.safeParse(url);
  if (!id.success) return fail("Netinkamos reikšmės.", "invalid");
  if (!address.success) return fail("Įklijuokite „Sirvoy“ iCal eksporto adresą (secured.sirvoy.com/ical/…).", "invalid");

  const { error } = await ctx.supabase.rpc("set_external_feed", { p_calendar: id.data, p_url: address.data });
  if (error) return dbError(error);
  if (address.data) {
    try {
      await syncExternalCalendars(id.data);
    } catch (e) {
      console.error("External feed: first read failed", e);
    }
  }
  return done(null);
}

/** Owner-only: reads every connected room feed now instead of waiting for the next scheduled run. */
export async function syncExternalNow(): Promise<ActionResult<{ synced: number; failed: number }>> {
  const ctx = await staffClient("owner");
  if (!ctx.ok) return ctx.error;
  try {
    const { synced, failed } = await syncExternalCalendars();
    return done({ synced, failed });
  } catch (e) {
    if (e instanceof MissingServiceKeyError) return fail("Trūksta SUPABASE_SERVICE_ROLE_KEY serveryje.", "config");
    console.error("External sync failed", e);
    return fail("Nepavyko sinchronizuoti. Bandykite dar kartą.", "sync");
  }
}

export interface RoomExportLink {
  calendarId: string;
  label: string;
  stayTypeId: string;
  url: string;
}

/**
 * Owner-only (ADR-0134): the secret address of each room's calendar of OUR bookings, to paste into Sirvoy
 * (Settings → Channels → iCal → the room → "Enter iCal URL here"). Read on request, never with the admin data.
 */
export async function roomExportLinks(): Promise<ActionResult<RoomExportLink[]>> {
  const ctx = await staffClient("owner");
  if (!ctx.ok) return ctx.error;
  const { data, error } = await ctx.supabase.rpc("stay_room_export_links");
  if (error) return dbError(error);
  return {
    data: data.map((r) => ({ calendarId: r.calendar_id, label: r.label, stayTypeId: r.stay_type_id, url: `${SITE_URL}/api/ical/room/${r.token}.ics` })),
  };
}
