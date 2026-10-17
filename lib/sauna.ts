export const SLOT_TIMES = ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00"] as const;
export type SlotTime = (typeof SLOT_TIMES)[number];

export const SESSION_MINUTES = 90;
export const MAX_PARTY = 8;
export const VIHTA_PRICE = 5;

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function slotPrice(date: Date, time: SlotTime): number {
  if (isWeekend(date)) return 90;
  const hour = Number(time.split(":")[0]);
  return hour >= 17 ? 75 : 60;
}

/** Deterministic pseudo-availability so server and client render the same thing. */
export function isSlotAvailable(dateKey: string, time: SlotTime): boolean {
  const s = dateKey + time;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 5 !== 0;
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

export function bookingReference(dateK: string, time: string, partySize: number): string {
  const s = `${dateK}${time}${partySize}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 131 + s.charCodeAt(i)) >>> 0;
  const code = (h % 9000) + 1000;
  return `PM-${code}`;
}
