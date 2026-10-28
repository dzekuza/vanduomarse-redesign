import { parseDay } from "@/lib/admin/format";

/** One feed for the Renginiai page: every published row of `public.events` in the window. */
export const EVENT_CATEGORIES = [
  { id: "pirtis", label: "Pirtis" },
  { id: "vakarai", label: "Vakarai" },
  { id: "akademija", label: "Akademija" },
  { id: "sventes", label: "Šventės" },
  { id: "keturratis", label: "Keturračiai" },
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number]["id"];

export interface ParkEvent {
  key: string;
  title: string;
  category: EventCategory;
  date: Date;
  time: string;
  place: string;
  blurb: string;
  /** null = free entry */
  price: number | null;
  /** Spots left, when the event is capacity-limited. */
  spotsLeft?: number;
  /** No `href`: registration happens in an inline form (events without a seat limit). */
  cta: { label: string; href?: string };
}

export const EVENTS_WINDOW_DAYS = 30;

const MONTHS_NOMINATIVE = [
  "Sausis", "Vasaris", "Kovas", "Balandis", "Gegužė", "Birželis",
  "Liepa", "Rugpjūtis", "Rugsėjis", "Spalis", "Lapkritis", "Gruodis",
];

/** "Spalis 2026": month heading for grouping the feed. */
export function monthHeading(date: Date): string {
  return `${MONTHS_NOMINATIVE[date.getMonth()]} ${date.getFullYear()}`;
}

/** Serializable shape passed from the server (`lib/data/public.ts`). */
export interface ParkEventData extends Omit<ParkEvent, "date"> {
  /** yyyy-mm-dd */
  date: string;
}

export const toParkEvent = (e: ParkEventData): ParkEvent => ({ ...e, date: parseDay(e.date) });
