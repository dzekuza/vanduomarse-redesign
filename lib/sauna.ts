/**
 * Private hire is sold by the hour: pick a start, then 2-6 hours.
 *
 * Live rates and limits come from `public.sauna_settings` (edited in
 * /admin/pirtis). The constants below are the "Kainodara'26-'27.xlsx" sheet
 * snapshot (incl. 21% PVM): the database was seeded from them, and the event
 * calculator (`lib/event-pricing.ts`) still prices from them.
 */
export const OPEN_HOUR = 10;
export const CLOSE_HOUR = 22;
export const MIN_HOURS = 2;
export const MAX_HOURS = 6;

export const MAX_PARTY = 20;

/** Hourly rate depends on group size, not time of day. */
export const SMALL_GROUP_MAX = 6;
export const SMALL_GROUP_RATE = 70;
export const LARGE_GROUP_RATE = 100;
/** 4-hour package for the whole sauna; applied when it beats the hourly price. */
export const PACKAGE_HOURS = 4;
export const PACKAGE_PRICE = 350;
/**
 * Pirtininkas, per booking. The sauna rows of the sheet say +100 €; the
 * contract-terms sheet says 200 € per event. Using 100 € until confirmed.
 */
export const MASTER_PRICE = 100;

/** Everything that prices or bounds a private booking; a `sauna_settings` row. */
export interface SaunaRates {
  smallGroupMax: number;
  smallGroupRate: number;
  largeGroupRate: number;
  maxParty: number;
  minHours: number;
  maxHours: number;
  packageHours: number;
  packagePrice: number;
  openHour: number;
  closeHour: number;
}

export const DEFAULT_SAUNA_RATES: SaunaRates = {
  smallGroupMax: SMALL_GROUP_MAX,
  smallGroupRate: SMALL_GROUP_RATE,
  largeGroupRate: LARGE_GROUP_RATE,
  maxParty: MAX_PARTY,
  minHours: MIN_HOURS,
  maxHours: MAX_HOURS,
  packageHours: PACKAGE_HOURS,
  packagePrice: PACKAGE_PRICE,
  openHour: OPEN_HOUR,
  closeHour: CLOSE_HOUR,
};

export function hourRate(partySize: number, rates: SaunaRates = DEFAULT_SAUNA_RATES): number {
  return partySize <= rates.smallGroupMax ? rates.smallGroupRate : rates.largeGroupRate;
}

/** Price for a session; short sessions bill the minimum, and the package applies if cheaper. */
export function sessionPrice(hours: number, partySize: number, rates: SaunaRates = DEFAULT_SAUNA_RATES): number {
  if (hours <= 0) return 0;
  const billable = Math.max(rates.minHours, hours);
  const hourly = billable * hourRate(partySize, rates);
  return billable === rates.packageHours ? Math.min(hourly, rates.packagePrice) : hourly;
}

/** Every start that leaves room for the minimum session before closing. */
export function startHours(rates: SaunaRates): number[] {
  return Array.from({ length: Math.max(0, rates.closeHour - rates.minHours - rates.openHour + 1) }, (_, i) => rates.openHour + i);
}

/** Session lengths the rates allow, shortest first. */
export function sessionLengths(rates: SaunaRates): number[] {
  return Array.from({ length: rates.maxHours - rates.minHours + 1 }, (_, i) => rates.minHours + i);
}

/**
 * Longest bookable run from `startHour`: stops at the next taken hour (booked
 * or closed by staff, from `sauna_taken_hours`), closing or the max length.
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

/** Whether a start can still be booked: not already past and the minimum session fits. */
export function isOpenStart(taken: readonly number[], startHour: number, rates: SaunaRates, pastHour: number): boolean {
  return startHour > pastHour && maxHoursFrom(taken, startHour, rates) >= rates.minHours;
}

export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function hoursLabel(hours: number): string {
  return `${hours} val.`;
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
