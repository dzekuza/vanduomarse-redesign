import { z } from "zod";
import { buildRoomFeed, roomFeedToken, type RoomFeedEvent } from "@/lib/ical-export";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const feedSchema = z.object({
  room: z.string(),
  active: z.boolean(),
  events: z.array(
    z.object({
      booking_id: z.string(),
      unit: z.number(),
      reference: z.string(),
      starts_on: z.string(),
      nights: z.number(),
      updated_at: z.string(),
    }),
  ),
});

/**
 * One Sirvoy room's calendar of OUR confirmed cabin bookings (ADR-0134), for Sirvoy's per-room iCal import, so a cabin
 * sold on the website or by staff is blocked on Booking.com. The address is secret (a 64-hex token per room, shown to
 * the owner at /admin/namukai); an unknown token answers 404. Blocks read in from Sirvoy are never part of it.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const token = roomFeedToken((await params).token);
  if (!token) return new Response("Not found", { status: 404 });

  try {
    const { data, error } = await createAdminClient().rpc("stay_room_feed", { p_token: token });
    if (error) throw new Error(error.message);
    if (data === null) return new Response("Not found", { status: 404 });
    const feed = feedSchema.parse(data);
    const events: RoomFeedEvent[] = feed.events.map((e) => ({
      bookingId: e.booking_id,
      unit: e.unit,
      reference: e.reference,
      startsOn: e.starts_on,
      nights: e.nights,
      updatedAt: e.updated_at,
    }));
    return new Response(buildRoomFeed(feed.room, events), {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="vanduo-marse-kambarys-${feed.room.replace(/[^\w-]/g, "")}.ics"`,
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (e) {
    console.error("Room feed failed", e);
    return new Response("Feed unavailable", { status: 500 });
  }
}
