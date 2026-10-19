import type { EventCategory } from "@/lib/park-events";

/**
 * Admin domain models. Shaped like the future Supabase rows (snake_case at the
 * DB edge, camelCase here) so the mock store can be swapped for a repository.
 */

export interface Customer {
  name: string;
  email: string;
  phone: string;
}

export type BookingKind = "pirtis" | "namelis" | "kemperis";
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
  /** Cabins only. */
  nights?: number;
  guests: number;
  extras: string[];
  total: number;
  status: BookingStatus;
  createdAt: string;
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
  time: string;
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
