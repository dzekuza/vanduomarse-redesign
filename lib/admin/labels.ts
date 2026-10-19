import type { BookingKind, BookingStatus, InquirySource, InquiryStatus } from "./types";

export const BOOKING_KIND: Record<BookingKind, string> = {
  pirtis: "Pirtis",
  namelis: "Namelis",
  kemperis: "Kemperis",
};

export const BOOKING_STATUS: Record<BookingStatus, string> = {
  laukia: "Laukia",
  patvirtinta: "Patvirtinta",
  ivykdyta: "Įvykdyta",
  atsaukta: "Atšaukta",
};

export const INQUIRY_STATUS: Record<InquiryStatus, string> = {
  nauja: "Nauja",
  susisiekta: "Susisiekta",
  pasiulymas: "Pasiūlymas",
  laimeta: "Laimėta",
  prarasta: "Prarasta",
};

export const INQUIRY_SOURCE: Record<InquirySource, string> = {
  skaiciuokle: "Skaičiuoklė",
  renginys: "Renginio registracija",
  kontaktai: "Kontaktai",
};

/** Cabin stock from the price sheet: 8 doubles + 6 quads, 40 beds. */
export const CABIN_COUNT = 14;
