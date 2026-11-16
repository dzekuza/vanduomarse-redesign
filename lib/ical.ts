/**
 * Reads the room availability feed Sirvoy exports as iCal (RFC 5545): every event is a stretch of
 * nights the room is taken (a booking or a closure). Only what the stock needs is kept: a unique id,
 * the first night and the number of nights. Guest details are not in the feed.
 */

export interface IcalBlock {
  uid: string;
  /** First taken night, yyyy-mm-dd. */
  startsOn: string;
  /** Nights taken; the check-out day is free (DTEND is exclusive). */
  nights: number;
}

export class IcalError extends Error {}

/** The only feed address accepted: a Sirvoy room export (the database checks the same pattern). */
export const SIRVOY_FEED_URL = /^https:\/\/secured\.sirvoy\.com\/ical\/[A-Za-z0-9-]{8,64}\/?$/;

/** Longest stretch kept; the database accepts the same. */
export const MAX_BLOCK_NIGHTS = 400;

const VILNIUS_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vilnius", year: "numeric", month: "2-digit", day: "2-digit" });

/** Content lines with RFC 5545 folding undone (a line starting with a space or tab continues the previous one). */
function unfold(text: string): string[] {
  const lines: string[] = [];
  for (const raw of text.split(/\r\n|\n|\r/)) {
    if ((raw.startsWith(" ") || raw.startsWith("\t")) && lines.length > 0) lines[lines.length - 1] += raw.slice(1);
    else lines.push(raw);
  }
  return lines;
}

interface Property {
  name: string;
  params: string;
  value: string;
}

function parseLine(line: string): Property | null {
  const colon = line.indexOf(":");
  if (colon < 1) return null;
  const head = line.slice(0, colon);
  const semi = head.indexOf(";");
  return {
    name: (semi === -1 ? head : head.slice(0, semi)).toUpperCase(),
    params: semi === -1 ? "" : head.slice(semi + 1).toUpperCase(),
    value: line.slice(colon + 1).trim(),
  };
}

/** A DATE or DATE-TIME value as a Vilnius calendar day (yyyy-mm-dd), or null when it is neither. */
function toDay(value: string): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z?))?$/.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, z] = m;
  if (z && h && mi && s) {
    const instant = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)));
    return Number.isNaN(instant.getTime()) ? null : VILNIUS_DAY.format(instant);
  }
  const day = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
  return day.getUTCMonth() === Number(mo) - 1 && day.getUTCDate() === Number(d) ? `${y}-${mo}-${d}` : null;
}

const dayNumber = (day: string) => Math.round(Date.parse(`${day}T00:00:00Z`) / 86_400_000);

/**
 * The taken stretches in an iCal feed that still matter on `today` (yyyy-mm-dd): cancelled events and
 * stretches that ended on or before today are dropped. Throws IcalError when the text is not an iCal
 * calendar at all (a login page or an empty body must never clear the stored blocks).
 */
export function parseIcalBlocks(text: string, today: string): IcalBlock[] {
  const lines = unfold(text);
  if (!lines.some((l) => l.trim().toUpperCase() === "BEGIN:VCALENDAR")) throw new IcalError("The response is not an iCal calendar");

  const blocks: IcalBlock[] = [];
  const seen = new Set<string>();
  let event: { uid?: string; start?: string; end?: string; cancelled: boolean; days?: number } | null = null;

  for (const line of lines) {
    const upper = line.trim().toUpperCase();
    if (upper === "BEGIN:VEVENT") {
      event = { cancelled: false };
      continue;
    }
    if (upper === "END:VEVENT") {
      if (event?.start && !event.cancelled) {
        const startDay = dayNumber(event.start);
        const endDay = event.end ? dayNumber(event.end) : startDay + (event.days ?? 1);
        const nights = Math.min(MAX_BLOCK_NIGHTS, Math.max(1, endDay - startDay));
        if (startDay + nights > dayNumber(today)) {
          let uid = event.uid || `${event.start}-${nights}`;
          for (let n = 2; seen.has(uid); n++) uid = `${event.uid || event.start}#${n}`;
          seen.add(uid);
          blocks.push({ uid, startsOn: event.start, nights });
        }
      }
      event = null;
      continue;
    }
    if (!event) continue;

    const prop = parseLine(line);
    if (!prop) continue;
    switch (prop.name) {
      case "UID":
        event.uid = prop.value.slice(0, 200);
        break;
      case "DTSTART":
        event.start = toDay(prop.value) ?? undefined;
        break;
      case "DTEND":
        event.end = toDay(prop.value) ?? undefined;
        break;
      case "DURATION": {
        const days = /^P(?:(\d+)W)?(?:(\d+)D)?/.exec(prop.value);
        if (days) event.days = Number(days[1] ?? 0) * 7 + Number(days[2] ?? 0) || 1;
        break;
      }
      case "STATUS":
        event.cancelled = prop.value.toUpperCase() === "CANCELLED";
        break;
    }
  }

  return blocks.toSorted((a, b) => a.startsOn.localeCompare(b.startsOn));
}
