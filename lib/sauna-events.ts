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
  /** yyyy-mm-dd */
  date: string;
  time: string;
  /** null when the session has no set length. */
  minutes: number | null;
  pricePerPerson: number;
  spotsLeft: number;
  blurb: string;
}

export interface SaunaEvent extends Omit<SaunaEventData, "date"> {
  date: Date;
}

export const toSaunaEvent = (e: SaunaEventData): SaunaEvent => ({ ...e, date: parseDay(e.date) });

/** Sessions in the listing window that still have at least one spot. */
export function openEventCount(events: readonly { spotsLeft: number }[]): number {
  return events.filter((e) => e.spotsLeft > 0).length;
}
