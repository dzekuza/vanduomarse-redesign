import { parseDay } from "@/lib/admin/format";

/**
 * Public sauna sessions (tickets per person, not per group). Rows live in
 * `public.events` with category `pirtis` and a capacity; recurring ones are
 * created from `sauna_event_templates` by `materialize_sauna_events()`.
 */

/** How far ahead public sessions are listed. */
export const EVENT_WINDOW_DAYS = 14;

/** Serializable shape passed from the server (`lib/data/public.ts`). */
export interface SaunaEventData {
  key: string;
  title: string;
  host: string;
  venue?: string;
  /** Named attendant, when the event has one in its location label. */
  hostName?: string;
  /** yyyy-mm-dd */
  date: string;
  time: string;
  /** null when the session has no set length. */
  minutes: number | null;
  pricePerPerson: number;
  capacity?: number;
  spotsLeft: number;
  blurb: string;
  description?: string;
  /** Set for sessions of a sauna program (priced from the program, booked through it). */
  programId: string | null;
}

export interface SaunaEvent extends Omit<SaunaEventData, "date"> {
  date: Date;
}

export const toSaunaEvent = (e: SaunaEventData): SaunaEvent => ({ ...e, date: parseDay(e.date) });

export function saunaSessionHref(id: string, page: "pirtis" | "rezervacija" = "pirtis"): string {
  const session = `seansas=${encodeURIComponent(id)}`;
  return page === "pirtis" ? `/pirtis?${session}#rezervuoti` : `/rezervacija?veikla=pirtis&${session}`;
}

/** Sessions in the listing window that still have at least one spot. */
export function openEventCount(events: readonly { spotsLeft: number }[]): number {
  return events.filter((e) => e.spotsLeft > 0).length;
}

/** A session blocks the private sauna while it runs and this long after it ends (cleaning), see ADR-0091. */
export const SESSION_BUFFER_MINUTES = 60;

/**
 * Whether a private booking collides with a session: the booking `[startHour, startHour + hours)` on the day `dayOffset`
 * days after the session's date, against `[session start, session end + SESSION_BUFFER_MINUTES)`. Minutes count from the
 * session date's midnight (`sessionStart` = HH:MM in minutes).
 */
export function sessionBlocksBooking(sessionStart: number, sessionMinutes: number, dayOffset: number, startHour: number, hours: number): boolean {
  const from = dayOffset * 1440 + startHour * 60;
  const to = from + hours * 60;
  return from < sessionStart + sessionMinutes + SESSION_BUFFER_MINUTES && to > sessionStart;
}
