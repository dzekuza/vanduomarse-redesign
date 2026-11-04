import type { CouponKind, CouponProduct, CouponService, CouponStatus } from "@/lib/coupons";
import type { EventCategory } from "@/lib/park-events";
import type { PermissionId, StaffAccess } from "@/lib/admin/permissions";
import type { QuadSettings, QuadType } from "@/lib/quads";
import type { Sauna } from "@/lib/sauna";
import type { SaunaProgram } from "@/lib/sauna-programs";
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

export type PaymentStatus = "laukia" | "apmoketa" | "pasibaige" | "nepavyko" | "grazinta";

/** The Stripe payment a web reservation was paid with (one payment covers all requests of that reservation). */
export interface PaymentInfo {
  id: string;
  status: PaymentStatus;
  amount: number;
  refunded: number;
  paidAt?: string;
  /** Paid late or for an unexpected amount: staff should check it in Stripe. */
  needsReview: boolean;
}

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
  /** Number of cabins or camper pitches in this stay. */
  stayUnits?: number;
  /** Sauna only: `public.saunas` id. */
  saunaId?: string;
  /** Null when the guest count was not requested for a stay. */
  guests: number | null;
  extras: string[];
  total: number;
  status: BookingStatus;
  createdAt: string;
  source?: BookingSource;
  /** Internal note from staff (manual bookings). */
  note?: string;
  payment?: PaymentInfo;
}

/** Sauna hours closed by staff (maintenance, private use). */
export interface Block {
  id: string;
  saunaId: string;
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
  /** Sauna program this session belongs to (its price then follows the program). */
  programId?: string;
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

/** A named set of admin pages. The Owner role has every page and manages staff. */
export interface StaffRole {
  id: string;
  name: string;
  description: string;
  isOwner: boolean;
  permissions: PermissionId[];
}

/** A person with an admin login. Only owners receive the full list. */
export interface StaffMember {
  userId: string;
  name: string;
  email: string;
  roleId: string;
  active: boolean;
  createdAt: string;
}

/** An hourly quad rental request or booking. */
export interface QuadRental {
  id: string;
  reference: string;
  items: { quadTypeId: string; units: number }[];
  /** yyyy-mm-dd */
  date: string;
  startHour: number;
  hours: number;
  /** Total vehicles across the rental items. */
  units: number;
  riders: number;
  customer: Customer;
  total: number;
  status: BookingStatus;
  source: BookingSource;
  note?: string;
  createdAt: string;
  payment?: PaymentInfo;
}

/** A ticket for an event (a row of event_tickets); quad tours and other events share the shape. */
export interface TourTicket {
  id: string;
  reference: string;
  eventId: string;
  eventTitle: string;
  /** yyyy-mm-dd */
  eventDate: string;
  /** HH:MM */
  eventTime: string;
  people: number;
  customer: Customer;
  total: number;
  status: BookingStatus;
  createdAt: string;
  payment?: PaymentInfo;
}

/** A coupon order or issued coupon. `code` stays unset until payment is confirmed. */
export interface Coupon {
  id: string;
  reference: string;
  code?: string;
  productName: string;
  kind: CouponKind;
  service: CouponService;
  faceValue: number;
  balance: number;
  status: CouponStatus;
  buyer: { name: string; email: string };
  recipientName: string;
  message: string;
  createdAt: string;
  paidAt?: string;
  /** yyyy-mm-dd */
  expiresAt?: string;
  redemptions: { id: string; amount: number; note: string; at: string }[];
}

/** Everything the dashboard renders, loaded once per request in the admin layout. */
export interface AdminData {
  bookings: Booking[];
  blocks: Block[];
  inquiries: Inquiry[];
  events: ManagedEvent[];
  prices: PriceItem[];
  /** All saunas incl. hidden ones, in display order. */
  saunas: Sauna[];
  upsells: Upsell[];
  /** All sauna programs incl. hidden ones, in display order. */
  programs: SaunaProgram[];
  coupons: Coupon[];
  couponProducts: CouponProduct[];
  quadTypes: QuadType[];
  quadSettings: QuadSettings;
  quadRentals: QuadRental[];
  tourTickets: TourTicket[];
  /** Seat requests for public sauna sessions and other limited events (not quad tours). */
  eventTickets: TourTicket[];
  /** The signed-in staff member. */
  me: StaffAccess;
  roles: StaffRole[];
  /** Empty unless `me` is an owner. */
  staff: StaffMember[];
}
