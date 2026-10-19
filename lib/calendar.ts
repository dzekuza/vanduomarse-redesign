/** A booking as a calendar entry, for Google Calendar links and .ics downloads. */
export interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  details: string;
  location: string;
  /** All-day span (e.g. a cabin stay): `end` is the day after the last day. */
  allDay?: boolean;
}

export const VENUE = "Vanduo Marse, ežero krantas, Lietuva";

const pad = (n: number) => String(n).padStart(2, "0");

/** 20261019T150000Z for timed events, 20261019 for all-day ones. */
function stamp(date: Date, allDay: boolean): string {
  if (allDay) return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`
  );
}

export function googleCalendarUrl(ev: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates: `${stamp(ev.start, !!ev.allDay)}/${stamp(ev.end, !!ev.allDay)}`,
    details: ev.details,
    location: ev.location,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** RFC 5545 text escaping. */
function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function icsContent(ev: CalendarEvent, uid: string): string {
  const allDay = !!ev.allDay;
  const dateProp = (name: string, d: Date) => (allDay ? `${name};VALUE=DATE:${stamp(d, true)}` : `${name}:${stamp(d, false)}`);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vanduo Marse//Rezervacija//LT",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}@vanduomarse.lt`,
    `DTSTAMP:${stamp(new Date(), false)}`,
    dateProp("DTSTART", ev.start),
    dateProp("DTEND", ev.end),
    `SUMMARY:${escapeIcs(ev.title)}`,
    `DESCRIPTION:${escapeIcs(ev.details)}`,
    `LOCATION:${escapeIcs(ev.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** A Date on `day` at `hour:minute` local time. */
export function at(day: Date, hour: number, minute = 0): Date {
  const d = new Date(day);
  d.setHours(hour, minute, 0, 0);
  return d;
}
