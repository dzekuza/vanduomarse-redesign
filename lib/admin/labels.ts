import { CABIN_TOTAL } from "@/lib/cabin";
import type { BookingKind, BookingSource, BookingStatus, InquirySource, InquiryStatus, PaymentStatus } from "./types";

export const BOOKING_KIND: Record<BookingKind, string> = {
  pirtis: "Pirtis",
  namelis: "Namelis",
  kemperis: "Kemperis",
};

export const BOOKING_SOURCE: Record<BookingSource, string> = {
  svetaine: "Svetainė",
  telefonu: "Telefonu",
  vietoje: "Vietoje",
};

export const BOOKING_STATUS: Record<BookingStatus, string> = {
  laukia: "Laukia",
  patvirtinta: "Patvirtinta",
  ivykdyta: "Įvykdyta",
  atsaukta: "Atšaukta",
};

export const PAYMENT_STATUS: Record<PaymentStatus, string> = {
  laukia: "Laukia apmokėjimo",
  apmoketa: "Apmokėta",
  pasibaige: "Apmokėjimas baigėsi",
  nepavyko: "Apmokėjimas nepavyko",
  grazinta: "Grąžinta",
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

/** Cabin stock from the price sheet (see `CABIN_SIZES`). */
export const CABIN_COUNT = CABIN_TOTAL;
