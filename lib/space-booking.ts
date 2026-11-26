import { dayTypeOf, SPACES, type SpaceId } from "@/lib/event-pricing";

/** The whole-park hires take every other space with them. */
const WHOLE_PARK: readonly SpaceId[] = ["parkas", "parkas-wake"];

const takesAll = (id: SpaceId) => WHOLE_PARK.includes(id);

/** Two spaces cannot be hired at once when they are the same or either one is the whole park. */
export const spacesClash = (a: SpaceId, b: SpaceId) => a === b || takesAll(a) || takesAll(b);

/** Whether any space of `wanted` clashes with any of `taken`. */
export const anySpaceClash = (wanted: readonly SpaceId[], taken: readonly SpaceId[]) => wanted.some((w) => taken.some((t) => spacesClash(w, t)));

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

/** The price sheet's rent for the chosen spaces on that day (evening hires use the weekend column); spaces not offered then add nothing. Staff overwrite it with the agreed price. */
export function suggestedSpacePrice(spaces: readonly SpaceId[], date: string, guests: number): number {
  if (!date) return 0;
  const day = dayTypeOf(date, "evening");
  return spaces.reduce((sum, id) => sum + (SPACES.find((s) => s.id === id)?.rent(day, guests) ?? 0), 0);
}

export const spaceLabels = (ids: readonly SpaceId[]) => ids.map((id) => SPACES.find((s) => s.id === id)?.label ?? id).join(", ");
