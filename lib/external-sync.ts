import "server-only";
import { IcalError, parseIcalBlocks } from "@/lib/ical";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

/** What one run did, per room (calendar id) and in total. */
export interface ExternalSyncResult {
  synced: number;
  failed: number;
  /** Per calendar: the number of blocks read, or the reason it failed. */
  calendars: { id: string; blocks?: number; error?: string }[];
}

/** The only host the server is allowed to fetch (the database check on the stored URL says the same). */
const FEED_HOST = "secured.sirvoy.com";
const FETCH_TIMEOUT_MS = 15_000;
const MAX_FEED_BYTES = 2_000_000;

const todayInVilnius = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vilnius", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

async function readFeed(url: string): Promise<string> {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== FEED_HOST) throw new IcalError("The feed address is not a Sirvoy URL");

  // No redirects: a feed that moves must be re-entered, never followed to another host.
  const response = await fetch(parsed, { redirect: "error", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), cache: "no-store", headers: { accept: "text/calendar, text/plain" } });
  if (!response.ok) throw new IcalError(`Sirvoy answered ${response.status}`);
  const text = await response.text();
  if (text.length > MAX_FEED_BYTES) throw new IcalError("The feed is too large");
  return text;
}

const reason = (e: unknown) => (e instanceof Error ? e.message : "Unknown error");

/**
 * Reads every active Sirvoy room feed (or one room when `onlyCalendarId` is set) and replaces that
 * room's blocks. A room whose feed cannot be read keeps its old blocks and records why; a response that
 * is not an iCal calendar never clears anything. Uses the service role through its three sync functions only.
 */
export async function syncExternalCalendars(onlyCalendarId?: string): Promise<ExternalSyncResult> {
  const supabase = createAdminClient();
  const { data: feeds, error } = await supabase.rpc("external_sync_feeds");
  if (error) throw new Error(`Could not list the feeds: ${error.message}`);

  const today = todayInVilnius();
  const result: ExternalSyncResult = { synced: 0, failed: 0, calendars: [] };

  await Promise.all(
    feeds
      .filter((feed) => onlyCalendarId === undefined || feed.calendar_id === onlyCalendarId)
      .map(async (feed) => {
        try {
          const blocks = parseIcalBlocks(await readFeed(feed.feed_url), today);
          const payload: Json = blocks.map((b) => ({ uid: b.uid, starts_on: b.startsOn, nights: b.nights }));
          const { error: syncError } = await supabase.rpc("sync_external_blocks", { p_calendar: feed.calendar_id, p_blocks: payload });
          if (syncError) throw new Error(syncError.message);
          result.synced++;
          result.calendars.push({ id: feed.calendar_id, blocks: blocks.length });
        } catch (e) {
          const message = reason(e);
          await supabase.rpc("external_sync_failed", { p_calendar: feed.calendar_id, p_error: message });
          result.failed++;
          result.calendars.push({ id: feed.calendar_id, error: message });
        }
      }),
  );
  return result;
}
