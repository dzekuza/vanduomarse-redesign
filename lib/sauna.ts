/**
 * Private hire is sold by session length: pick a start, then one of the lengths
 * on offer (2-4 h). Each length has a fixed price for the whole sauna, and Fri-Sun
 * has its own table (usually without the shortest length).
 *
 * Live prices and limits come from `public.saunas` (edited in /admin/pirtis).
 * The constants below are the defaults the form starts from (the owner's sheet
 * of 2026-11-11, incl. 21% PVM). The database re-prices every booking.
 */
export const OPEN_HOUR = 10;
export const CLOSE_HOUR = 22;
export const MIN_HOURS = 2;
export const MAX_HOURS = 4;

/** The whole opening day (10:00-22:00) as one length: a 12 h key in the price tables, labelled "Visa diena". */
export const FULL_DAY_HOURS = 12;

export const MAX_PARTY = 20;
/** The price covers this many people; every guest above pays `EXTRA_GUEST_FEE` once. */
export const INCLUDED_GUESTS = 10;
export const EXTRA_GUEST_FEE = 15;
/** Hours kept free before and after a session (cleaning and heating). */
export const TURNAROUND_HOURS = 1;

/** Session length (hours) -> price for the whole sauna. */
export type PriceTable = Record<number, number>;

export const WEEKDAY_PRICES: PriceTable = { 2: 160, 3: 220, 4: 240 };
export const WEEKEND_PRICES: PriceTable = { 3: 250, 4: 320 };

/** Everything that prices or bounds a private booking; a `saunas` row. */
export interface SaunaRates {
  /** Mon-Thu. */
  weekdayPrices: PriceTable;
  /** Fri-Sun. */
  weekendPrices: PriceTable;
  includedGuests: number;
  extraGuestFee: number;
  turnaroundHours: number;
  maxParty: number;
  /** Shortest and longest length across both tables (the form keeps them in step). */
  minHours: number;
  maxHours: number;
  openHour: number;
  closeHour: number;
}

export const DEFAULT_SAUNA_RATES: SaunaRates = {
  weekdayPrices: WEEKDAY_PRICES,
  weekendPrices: WEEKEND_PRICES,
  includedGuests: INCLUDED_GUESTS,
  extraGuestFee: EXTRA_GUEST_FEE,
  turnaroundHours: TURNAROUND_HOURS,
  maxParty: MAX_PARTY,
  minHours: MIN_HOURS,
  maxHours: MAX_HOURS,
  openHour: OPEN_HOUR,
  closeHour: CLOSE_HOUR,
};

/** Storage bucket with sauna photos (public read; staff with `pirtis` upload). */
export const SAUNA_PHOTO_BUCKET = "sauna-photos";
export const MAX_SAUNA_PHOTOS = 12;
export const MAX_SAUNA_FEATURES = 12;

export interface SaunaPhoto {
  /** Object path in `SAUNA_PHOTO_BUCKET`, e.g. `malkine/3f…e1.webp`. */
  path: string;
  url: string;
}

/** A sauna type for private hire; a `public.saunas` row with its offered extras. */
export interface Sauna {
  /** Slug, also used in `?pirtis=` links. */
  id: string;
  name: string;
  description: string;
  /** Short facts shown on the picker card, e.g. "Iki 8 žmonių". */
  features: string[];
  /** In display order; the first is the cover. */
  photos: SaunaPhoto[];
  rates: SaunaRates;
  /** `sauna_upsells` ids this sauna offers. */
  upsellIds: string[];
  /** Bookable and shown. */
  active: boolean;
  /** Shown as "Netrukus atsidarys" but not bookable (never together with `active`). */
  comingSoon: boolean;
  sortOrder: number;
}

/** Visibility of a sauna: bookable, announced ("Netrukus atsidarys") or hidden. */
export const SAUNA_STATUSES = ["active", "coming-soon", "hidden"] as const;
export type SaunaStatus = (typeof SAUNA_STATUSES)[number];

export const SAUNA_STATUS_LABELS: Record<SaunaStatus, string> = {
  active: "Rodoma ir galima rezervuoti",
  "coming-soon": "Netrukus atsidarys (rodoma, nerezervuojama)",
  hidden: "Paslėpta",
};

export const saunaStatus = (s: Pick<Sauna, "active" | "comingSoon">): SaunaStatus => (s.active ? "active" : s.comingSoon ? "coming-soon" : "hidden");

/** Lowest session price, for "nuo X €". */
export function fromPrice(rates: SaunaRates): number {
  return Math.min(...Object.values(rates.weekdayPrices), ...Object.values(rates.weekendPrices));
}

/** Public URL of a photo in the sauna bucket. */
export function saunaPhotoUrl(supabaseUrl: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${SAUNA_PHOTO_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

/** URL-safe id from a name: "Malkinė pirtis" -> "malkine-pirtis". */
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

/** Friday, Saturday and Sunday use the weekend table. `day` is yyyy-mm-dd. */
export function isWeekendDay(day: string): boolean {
  const [y, m, d] = day.split("-").map(Number);
  const weekday = new Date(y, m - 1, d).getDay();
  return weekday === 0 || weekday >= 5;
}

/** The price table for a day; no day means a weekday (quotes without a date). */
export function pricesFor(rates: SaunaRates, day?: string): PriceTable {
  return day && isWeekendDay(day) ? rates.weekendPrices : rates.weekdayPrices;
}

/**
 * Lengths on offer that day, shortest first. `minHours` lifts the floor
 * (the sauna master needs 3 h).
 */
export function sessionLengths(rates: SaunaRates, day?: string, minHours = 0): number[] {
  return Object.keys(pricesFor(rates, day))
    .map(Number)
    .filter((h) => h >= minHours)
    .sort((a, b) => a - b);
}

/** Shortest bookable length that day, with the extras' floor applied; 0 when nothing fits. */
export function minHoursFor(rates: SaunaRates, day?: string, minHours = 0): number {
  return sessionLengths(rates, day, minHours)[0] ?? 0;
}

/** Guests above the included number pay a flat fee each. */
export function guestSurcharge(partySize: number, rates: SaunaRates): number {
  return Math.max(0, partySize - rates.includedGuests) * rates.extraGuestFee;
}

/** Price for a session: the length's fixed price plus the extra-guest fee. A length not on offer bills as the next one up. */
export function sessionPrice(hours: number, partySize: number, rates: SaunaRates, day?: string): number {
  if (hours <= 0) return 0;
  const lengths = sessionLengths(rates, day);
  const billable = lengths.find((h) => h >= hours) ?? lengths[lengths.length - 1];
  if (billable === undefined) return 0;
  return pricesFor(rates, day)[billable] + guestSurcharge(partySize, rates);
}

/** Every start that leaves room for the shortest session before closing. */
export function startHours(rates: SaunaRates, minHours = rates.minHours): number[] {
  return Array.from({ length: Math.max(0, rates.closeHour - minHours - rates.openHour + 1) }, (_, i) => rates.openHour + i);
}

/**
 * Longest bookable run from `startHour`: stops at the next taken hour (booked
 * or closed by staff, from `sauna_taken`, which already includes the turnaround
 * around each booking), closing or the max length.
 */
export function maxHoursFrom(taken: readonly number[], startHour: number, rates: SaunaRates): number {
  let hours = 0;
  while (hours < rates.maxHours && startHour + hours < rates.closeHour && !taken.includes(startHour + hours)) hours++;
  return hours;
}

/** Last hour already started on `day` (starts at or before it are gone); -1 on any later day. */
export function pastHourOn(day: string, today: string, nowHour: number): number {
  return day === today ? nowHour : -1;
}

/** Whether a start can still be booked: not already past and the shortest session (`minHours`) fits. */
export function isOpenStart(taken: readonly number[], startHour: number, rates: SaunaRates, pastHour: number, minHours = rates.minHours): boolean {
  return startHour > pastHour && minHours > 0 && maxHoursFrom(taken, startHour, rates) >= minHours;
}

export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function hoursLabel(hours: number): string {
  return hours === FULL_DAY_HOURS ? "Visa diena" : `${hours} val.`;
}

/** Current park hour (0-23, Europe/Vilnius), wherever the server runs. */
export function vilniusHour(now: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "Europe/Vilnius" }).format(now)) % 24;
}

/** Today's park date (Europe/Vilnius) as yyyy-mm-dd, wherever the server runs. */
export function todayKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vilnius" }).format(now);
}

/** `count` local dates starting at the yyyy-mm-dd `fromKey` (used by the day pickers). */
export function nextDays(fromKey: string, count: number): Date[] {
  const [y, m, d] = fromKey.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => new Date(y, m - 1, d + i));
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const WEEKDAYS_LT = ["Sk", "Pr", "An", "Tr", "Kt", "Pn", "Št"];

export function weekdayLabel(date: Date): string {
  return WEEKDAYS_LT[date.getDay()];
}

const MONTHS_LT = [
  "Sausio",
  "Vasario",
  "Kovo",
  "Balandžio",
  "Gegužės",
  "Birželio",
  "Liepos",
  "Rugpjūčio",
  "Rugsėjo",
  "Spalio",
  "Lapkričio",
  "Gruodžio",
];

export function longDateLabel(date: Date): string {
  return `${date.getDate()} ${MONTHS_LT[date.getMonth()]}`;
}
