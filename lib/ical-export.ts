/**
 * Builds the outbound iCal feed of one Sirvoy room (ADR-0134): our confirmed cabin bookings that were given that room,
 * one all-day VEVENT per booking unit, DTEND = check-out day (exclusive). Sirvoy imports it ("Enter iCal URL here" per
 * room) and shows each event as a "No Name" booking, so Booking.com stops selling those nights. Only a booking
 * reference goes out: no guest name, phone or price.
 */

export interface RoomFeedEvent {
  bookingId: string;
  unit: number;
  reference: string;
  /** First night, yyyy-mm-dd. */
  startsOn: string;
  nights: number;
  /** ISO timestamp of the last change, for LAST-MODIFIED. */
  updatedAt: string;
}

/** Feed tokens are 64 hex characters (two UUIDs without dashes); a trailing ".ics" is allowed in the address. */
export const ROOM_FEED_TOKEN = /^[0-9a-f]{64}$/;

export const roomFeedToken = (segment: string): string | null => {
  const token = segment.toLowerCase().replace(/\.ics$/, "");
  return ROOM_FEED_TOKEN.test(token) ? token : null;
};

const compactDate = (day: string) => day.replaceAll("-", "");

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** 20261126T101500Z */
const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

/** RFC 5545 TEXT escaping. */
const escapeText = (text: string) => text.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Folds a content line at 75 octets (RFC 5545 3.1); continuation lines start with a space. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    if (size + n > (parts.length ? 74 : 75)) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += ch;
    size += n;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

/** The whole VCALENDAR text for one room. `now` is the DTSTAMP of every event. */
export function buildRoomFeed(room: string, events: readonly RoomFeedEvent[], now: Date = new Date()): string {
  const dtstamp = stamp(now.toISOString());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vanduo Marse//Room calendar//LT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(`Vanduo Marse – kambarys ${room}`)}`,
    ...events.flatMap((e) => [
      "BEGIN:VEVENT",
      `UID:vm-${e.bookingId}-${e.unit}@vanduomarse.lt`,
      `DTSTAMP:${dtstamp}`,
      `LAST-MODIFIED:${stamp(e.updatedAt)}`,
      `DTSTART;VALUE=DATE:${compactDate(e.startsOn)}`,
      `DTEND;VALUE=DATE:${compactDate(addDays(e.startsOn, e.nights))}`,
      `SUMMARY:${escapeText(`Vanduo Marse ${e.reference}`)}`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  return `${lines.map(fold).join("\r\n")}\r\n`;
}
