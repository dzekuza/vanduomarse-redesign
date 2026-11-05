/**
 * Quad (keturratis) rental. Fleet, settings and rentals live in `public.quad_*`
 * (managed in /admin/keturraciai); guided tours are `events` with category
 * `keturratis`. This module holds the shared types and the pure helpers used by
 * the public rental flow and the admin.
 */

export interface QuadType {
  id: string;
  name: string;
  description: string;
  /** Riders one quad carries (1 or 2). */
  seats: number;
  /** How many of this quad the park owns. */
  units: number;
  /** EUR per quad per hour incl. 21% PVM. */
  pricePerHour: number;
  active: boolean;
}

export interface QuadRentalItem {
  type: QuadType;
  units: number;
}

export interface QuadSettings {
  /** First start hour and closing hour (a rental must end by it). */
  openHour: number;
  closeHour: number;
  maxHours: number;
  /** Refundable deposit in EUR; 0 = none shown. */
  deposit: number;
  minAge: number;
  /** Free-text rules; empty = nothing shown. */
  rules: string;
}

/** yyyy-mm-dd -> quad type id -> hour -> quads taken, from `quad_taken()`. */
export type QuadTaken = Record<string, Record<string, Record<number, number>>>;

/** Days ahead the rental day strip shows. */
export const QUAD_DAYS = 21;
export const MAX_QUAD_RENTAL_UNITS = 20;

export function quadRentalUnitLimit(type: QuadType, otherUnits: number): number {
  return Math.max(0, Math.min(type.units, MAX_QUAD_RENTAL_UNITS - otherUnits));
}

/** Upcoming guided tours shown on the public page (rows of `events`). */
export interface QuadTourData {
  key: string;
  title: string;
  /** yyyy-mm-dd */
  date: string;
  /** HH:MM */
  time: string;
  minutes: number | null;
  pricePerPerson: number;
  spotsLeft: number;
  blurb: string;
  place: string;
}

export const rentalPrice = (type: Pick<QuadType, "pricePerHour">, hours: number, units: number) => type.pricePerHour * hours * units;

export const fleetRentalPrice = (items: readonly QuadRentalItem[], hours: number) =>
  items.reduce((total, { type, units }) => total + rentalPrice(type, hours, units), 0);

/** Most riders `units` quads of this type can carry. */
export const maxRiders = (type: Pick<QuadType, "seats">, units: number) => type.seats * units;

/** Quads of `type` still free at `hour` on `day`. */
export function freeAt(type: QuadType, taken: QuadTaken, day: string, hour: number): number {
  return Math.max(0, type.units - (taken[day]?.[type.id]?.[hour] ?? 0));
}

/**
 * Longest rental (in hours) that can start at `startHour` for `units` quads:
 * every hour needs `units` free, and it can't pass closing or the max length.
 * 0 means the start is not available.
 */
export function longestFrom(type: QuadType, taken: QuadTaken, day: string, startHour: number, units: number, s: QuadSettings): number {
  let hours = 0;
  while (hours < s.maxHours && startHour + hours < s.closeHour && freeAt(type, taken, day, startHour + hours) >= units) hours++;
  return hours;
}

/** How long every selected type is free together, stopping before any time held by another activity. */
export function longestForFleet(items: readonly QuadRentalItem[], taken: QuadTaken, day: string, startHour: number, settings: QuadSettings, busy: readonly number[] = []): number {
  if (!items.length) return 0;
  const longest = Math.min(...items.map(({ type, units }) => longestFrom(type, taken, day, startHour, units, settings)));
  let hours = 0;
  while (hours < longest && !busy.includes(startHour + hours)) hours++;
  return hours;
}

/** Most quads of `type` free in any single hour of the day, from `fromHour` on (to ignore hours already past today). */
export function mostFreeOnDay(type: QuadType, taken: QuadTaken, day: string, s: QuadSettings, fromHour = s.openHour): number {
  let best = 0;
  for (let h = Math.max(s.openHour, fromHour); h < s.closeHour; h++) best = Math.max(best, freeAt(type, taken, day, h));
  return best;
}

export const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;
