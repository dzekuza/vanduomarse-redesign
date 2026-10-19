/** Private hire is sold by the hour: pick a start, then 2-6 hours. */
export const OPEN_HOUR = 10;
export const CLOSE_HOUR = 22;
export const MIN_HOURS = 2;
export const MAX_HOURS = 6;

export const MAX_PARTY = 8;
export const VIHTA_PRICE = 5;
/** Sauna master (pirtininkas) leading the session, charged per hour booked. */
export const MASTER_RATE = 30;

/** Every start that leaves room for the minimum session before closing. */
export const START_HOURS: number[] = Array.from(
  { length: CLOSE_HOUR - MIN_HOURS - OPEN_HOUR + 1 },
  (_, i) => OPEN_HOUR + i,
);

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function hourRate(date: Date, hour: number): number {
  if (isWeekend(date)) return 60;
  return hour >= 17 ? 50 : 40;
}

export function sessionPrice(date: Date, startHour: number, hours: number): number {
  let total = 0;
  for (let h = startHour; h < startHour + hours; h++) total += hourRate(date, h);
  return total;
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
