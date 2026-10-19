/**
 * Private hire is sold by the hour: pick a start, then 2-6 hours.
 * Rates from "Kainodara'26-'27.xlsx" (incl. 21% PVM, valid until 2027-12-31).
 */
export const OPEN_HOUR = 10;
export const CLOSE_HOUR = 22;
export const MIN_HOURS = 2;
export const MAX_HOURS = 6;

export const MAX_PARTY = 20;
export const VIHTA_PRICE = 5;

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

/** Every start that leaves room for the minimum session before closing. */
export const START_HOURS: number[] = Array.from(
  { length: CLOSE_HOUR - MIN_HOURS - OPEN_HOUR + 1 },
  (_, i) => OPEN_HOUR + i,
);

/** Everything that prices or bounds a private booking; editable in /admin/pirtis. */
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

/** Deterministic pseudo-availability so server and client render the same thing. */
function isHourBooked(dateKey: string, hour: number): boolean {
  const s = `${dateKey}${hour}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 6 === 0;
}

/** Longest bookable run from `startHour`: stops at the next booking, closing or MAX_HOURS. */
export function maxHoursFrom(dateKey: string, startHour: number): number {
  let hours = 0;
  while (hours < MAX_HOURS && startHour + hours < CLOSE_HOUR && !isHourBooked(dateKey, startHour + hours)) hours++;
  return hours;
}

export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function hoursLabel(hours: number): string {
  return `${hours} val.`;
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

export function bookingReference(dateK: string, startHour: number, hours: number, partySize: number): string {
  const s = `${dateK}${startHour}${hours}${partySize}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 131 + s.charCodeAt(i)) >>> 0;
  const code = (h % 9000) + 1000;
  return `PM-${code}`;
}
