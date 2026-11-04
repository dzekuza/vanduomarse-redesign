import { bookingWhen } from "./format";
import { BOOKING_KIND, BOOKING_SOURCE, BOOKING_STATUS } from "./labels";
import type { Booking } from "./types";

/**
 * CSV export for the admin tables. Shaped for Excel with a Lithuanian locale:
 * UTF-8 with BOM (so "ą, č, ė…" survive), ";" as the separator and "," as the
 * decimal mark. Pure functions — the download itself lives in the component.
 */

const SEPARATOR = ";";
const BOM = "﻿";

export const BOOKING_CSV_HEADERS = [
  "Nr.",
  "Tipas",
  "Data",
  "Laikas / naktys",
  "Svečiai",
  "Klientas",
  "El. paštas",
  "Telefonas",
  "Priedai",
  "Suma €",
  "Būsena",
  "Šaltinis",
  "Sukurta",
  "Pastaba",
  "Nakvynės vienetai",
] as const;

/**
 * Quote a cell when it holds the separator, quotes or line breaks. Text that
 * Excel would run as a formula (=, @, or +/- followed by more than a phone
 * number) gets a leading apostrophe — names and notes come from public forms.
 */
export function csvCell(value: string | number): string {
  let text = String(value);
  if (/^[=@\t\r]/.test(text) || /^[+-](?![\d\s()]*$)/.test(text)) text = `'${text}`;
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: readonly (readonly (string | number)[])[]): string {
  return BOM + rows.map((row) => row.map(csvCell).join(SEPARATOR)).join("\r\n") + "\r\n";
}

/** 1234.5 -> "1234,50": a number Excel (lt-LT) reads as a number. */
const csvAmount = (n: number) => n.toFixed(2).replace(".", ",");

/** ISO timestamp -> local "2026-10-19 14:05" (sortable, keeps the year). */
function csvDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function bookingsToCsv(bookings: readonly Booking[]): string {
  return toCsv([
    BOOKING_CSV_HEADERS,
    ...bookings.map((b) => [
      b.reference,
      BOOKING_KIND[b.kind],
      b.date,
      bookingWhen(b),
      b.guests ?? "",
      b.customer.name,
      b.customer.email,
      b.customer.phone,
      b.extras.join(", "),
      csvAmount(b.total),
      BOOKING_STATUS[b.status],
      BOOKING_SOURCE[b.source ?? "svetaine"],
      csvDateTime(b.createdAt),
      b.note ?? "",
      b.stayUnits ?? "",
    ]),
  ]);
}

/** "rezervacijos-2026-10-19.csv" */
export const exportFileName = (prefix: string, dayKey: string) => `${prefix}-${dayKey}.csv`;
