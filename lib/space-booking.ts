import { dayTypeOf } from "@/lib/event-pricing";

/**
 * An event space staff hire out: a row of `public.spaces` (ADR-0133), edited at /admin/erdves. The ids of the first
 * eight match the price sheet's `SpaceId` in lib/event-pricing.ts, which the public calculator still uses.
 */
export interface ManagedSpace {
  id: string;
  label: string;
  blurb: string;
  maxGuests: number;
  /** Rent incl. PVM on Mon–Thu daytime; null = not offered then. */
  priceWeekday: number | null;
  /** Rent incl. PVM in the evening and Fri–Sun; null = not offered then. */
  priceWeekend: number | null;
  /** Hiring it takes every other space (the whole park). */
  wholePark: boolean;
  active: boolean;
  sortOrder: number;
}

type SpaceRef = Pick<ManagedSpace, "id" | "wholePark">;

const takesAll = (id: string, spaces: readonly SpaceRef[]) => spaces.some((s) => s.id === id && s.wholePark);

/** Two spaces cannot be hired at once when they are the same or either one is the whole park. */
export const spacesClash = (a: string, b: string, spaces: readonly SpaceRef[]) => a === b || takesAll(a, spaces) || takesAll(b, spaces);

/** Whether any space of `wanted` clashes with any of `taken`. */
export const anySpaceClash = (wanted: readonly string[], taken: readonly string[], spaces: readonly SpaceRef[]) =>
  wanted.some((w) => taken.some((t) => spacesClash(w, t, spaces)));

/** A hire window: the first day at `startTime` until the last day at `endTime`. */
export interface HireWindow {
  date: string;
  endDate: string;
  startTime: string;
  endTime: string;
}

const startOf = (w: HireWindow) => `${w.date} ${w.startTime}`;
const endOf = (w: HireWindow) => `${w.endDate} ${w.endTime}`;

/** Windows overlap when each starts before the other ends (touching ends do not). */
export const windowsOverlap = (a: HireWindow, b: HireWindow) => startOf(a) < endOf(b) && startOf(b) < endOf(a);

/** Hires starting at or after this hour count as evening (weekend price), as on the price sheet. */
export const EVENING_FROM = "17:00";

/**
 * The rent of one space: Mon–Thu daytime uses the weekday price, evenings and Fri–Sun the weekend price (the sheet's
 * rule, `dayTypeOf`). Without a start time the hire counts as an evening. null = not offered then.
 */
export function spaceRent(space: Pick<ManagedSpace, "priceWeekday" | "priceWeekend">, date: string, startTime = EVENING_FROM): number | null {
  return dayTypeOf(date, startTime < EVENING_FROM ? "daytime" : "evening") === "weekday" ? space.priceWeekday : space.priceWeekend;
}

/** The listed rent for the chosen spaces; spaces not offered then add nothing. Staff overwrite it with the agreed price. */
export function suggestedSpacePrice(ids: readonly string[], date: string, spaces: readonly ManagedSpace[], startTime?: string): number {
  if (!date) return 0;
  return ids.reduce((sum, id) => {
    const space = spaces.find((s) => s.id === id);
    return sum + (space ? (spaceRent(space, date, startTime) ?? 0) : 0);
  }, 0);
}

/** "Kupolas: šventė, „Corona“ su baseinu"; an id with no row (should not happen) shows as itself. */
export const spaceLabels = (ids: readonly string[], spaces: readonly Pick<ManagedSpace, "id" | "label">[]) =>
  ids.map((id) => spaces.find((s) => s.id === id)?.label ?? id).join(", ");

/** The window an event in a space takes: from its start for `minutes` (may run past midnight). */
export function eventWindow(date: string, time: string, minutes: number): HireWindow {
  const end = new Date(new Date(`${date}T${time}:00Z`).getTime() + minutes * 60_000).toISOString();
  return { date, startTime: time, endDate: end.slice(0, 10), endTime: end.slice(11, 16) };
}

interface HireLike extends HireWindow {
  spaces: readonly string[];
  status: string;
}

interface SpaceEventLike {
  id: string;
  title: string;
  date: string;
  time: string;
  durationMinutes?: number;
  spaceId?: string;
}

/**
 * What already takes `spaceIds` in `window`: a live hire or another event in a space ("nuoma …" / "renginys „…“"),
 * or null when free. Same rule as the database triggers (ADR-0136); `ignoreEventId` skips the event being edited.
 */
export function spaceTakenBy(
  spaceIds: readonly string[],
  window: HireWindow,
  hires: readonly HireLike[],
  events: readonly SpaceEventLike[],
  spaces: readonly SpaceRef[],
  ignoreEventId?: string,
): string | null {
  const hire = hires.find((b) => b.status !== "atsaukta" && windowsOverlap(window, b) && anySpaceClash(spaceIds, b.spaces, spaces));
  if (hire) return `nuoma ${hire.date} ${hire.startTime}–${hire.endTime}`;
  const event = events.find(
    (e) => e.spaceId && e.durationMinutes && e.id !== ignoreEventId && windowsOverlap(window, eventWindow(e.date, e.time, e.durationMinutes)) && anySpaceClash(spaceIds, [e.spaceId], spaces),
  );
  return event ? `renginys „${event.title}“ ${event.date} ${event.time}` : null;
}
