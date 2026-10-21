import type { EventCategory } from "@/lib/park-events";
import type { SaunaRates } from "@/lib/sauna";
import type { Upsell } from "@/lib/sauna-upsells";

/**
 * Admin domain models. Mapped from Supabase rows in `lib/admin/mappers.ts`
 * (snake_case at the DB edge, camelCase here).
 */

export interface Customer {
  name: string;
  email: string;
  phone: string;
}

export type BookingKind = "pirtis" | "namelis" | "kemperis";
/** Where the booking came from; seeded/public ones are "svetaine". */
export type BookingSource = "svetaine" | "telefonu" | "vietoje";
export type BookingStatus = "laukia" | "patvirtinta" | "ivykdyta" | "atsaukta";

export interface Booking {
  id: string;
  reference: string;
  kind: BookingKind;
  customer: Customer;
  /** yyyy-mm-dd */
  date: string;
  /** Sauna only. */
  startHour?: number;
  hours?: number;
  /** Stays only. */
  nights?: number;
  /** Stays only: `namelis-2`, `namelis-4` or `kemperis` (public.stay_types). */
  stayTypeId?: string;
  guests: number;
  extras: string[];
  total: number;
  status: BookingStatus;
  createdAt: string;
  source?: BookingSource;
  /** Internal note from staff (manual bookings). */
  note?: string;
}

/** Sauna hours closed by staff (maintenance, private use). */
export interface Block {
  id: string;
  date: string;
  hour: number;
  reason: string;
}

export type InquiryStatus = "nauja" | "susisiekta" | "pasiulymas" | "laimeta" | "prarasta";
export type InquirySource = "skaiciuokle" | "renginys" | "kontaktai";

export interface Inquiry {
  id: string;
  createdAt: string;
  customer: Customer;
  source: InquirySource;
  eventType: string;
  date: string;
  guests: number;
  space: string;
  estimate: { min: number; max: number } | null;
  message: string;
  status: InquiryStatus;
  notes: { at: string; text: string }[];
}

export interface ManagedEvent {
  id: string;
  title: string;
  category: EventCategory;
  date: string;
  /** HH:MM */
  time: string;
  /** Set for public sauna sessions. */
  durationMinutes?: number;
  place: string;
  blurb: string;
  /** null = free entry */
  price: number | null;
  /** null = no ticket limit */
  capacity: number | null;
  sold: number;
  published: boolean;
}

export type PriceGroup = "Erdvės" | "Maitinimas" | "Paslaugos" | "Pramogos" | "Nakvynė";

export interface PriceItem {
  id: string;
  group: PriceGroup;
  label: string;
  unit: string;
  value: number;
  /** Upper bound when the sheet gives a range. */
  max?: number;
}

/** Everything the dashboard renders, loaded once per request in the admin layout. */
export interface AdminData {
  bookings: Booking[];
  blocks: Block[];
  inquiries: Inquiry[];
  events: ManagedEvent[];
  prices: PriceItem[];
  saunaRates: SaunaRates;
  upsells: Upsell[];
}
