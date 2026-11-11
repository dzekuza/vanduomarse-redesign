import type { DiscountCode } from "@/lib/discount-codes";
import type { NotificationTopic } from "@/lib/notification-topics";
import type { CouponKind, CouponProduct, CouponService, CouponStatus } from "@/lib/coupons";
import type { EventCategory } from "@/lib/park-events";
import type { PermissionId, StaffAccess } from "@/lib/admin/permissions";
import type { RIDE_PLAN_CATEGORIES } from "@/lib/ride-plans";
import type { StayType } from "@/lib/cabin";
import type { QuadSettings, QuadTourAccessory, QuadTourRoute, QuadType } from "@/lib/quads";
import type { Sauna } from "@/lib/sauna";
import type { SaunaProgram } from "@/lib/sauna-programs";
import type { SaunaMaster } from "@/lib/sauna-masters";
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
  /** Linked customer (Klientai), when matched or created. ADR-0042 */
  riderId?: string;
}

/** Sauna hours closed by staff (maintenance, private use). */
export interface Block {
  id: string;
  saunaId: string;
  date: string;
  hour: number;
  reason: string;
}

export type InquiryStatus = "nauja" | "susisiekta" | "pasiulymas";
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
  /** Cabins the calculator quote asked for (stay type id and count), arriving on `date`. */
  stays: { typeId: string; units: number }[];
  stayNights: number;
  /** Saunas of the quote; one with a start hour is booked on accept, the rest are quote lines. */
  saunas: { saunaId: string; hours: number; startHour: number | null; programId: string | null; extras: Record<string, number> }[];
  /** Set once staff accepted the inquiry and its cabins were booked. */
  acceptedAt?: string;
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
  /** Set for a dated departure of a quad tour product (`quad_tour_routes`); capacity is then in quads. */
  tourRouteId?: string;
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

/** A phone number that receives staff SMS, and the topics it is texted about. Owners only. */
/** Site-wide switches owners flip at /admin/svetaine. */
export interface SiteSettings {
  /** The public site shows the "coming soon" page (503) instead of its pages. */
  comingSoon: boolean;
}

export interface NotificationRecipient {
  id: string;
  name: string;
  /** E.164, e.g. +37061234567. */
  phone: string;
  topics: NotificationTopic[];
  active: boolean;
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
  /** Linked customer (Klientai), when matched or created. ADR-0042 */
  riderId?: string;
  /** Tour bookings: the tour product, and the dated departure (an event) it joined. */
  tourRouteId?: string;
  tourEventId?: string;
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
  /** Linked customer (Klientai), when matched or created. ADR-0042 */
  riderId?: string;
}

/** The plan catalogue's category: which /admin/apyrankes tab (and which till tab) it belongs to. */
export type RidePlanCategory = (typeof RIDE_PLAN_CATEGORIES)[number];

/** A plan a rider can be sold: a day pass, an hour slot, a subscription, … */
export interface RidePlan {
  id: string;
  name: string;
  description: string;
  /** EUR incl. 21% PVM; null = no charge (e.g. staff). */
  price: number | null;
  category: RidePlanCategory;
  active: boolean;
  sortOrder: number;
}

/** A park rider: contact details and the plan they're currently on, with an optional bound bracelet. */
export interface Rider {
  id: string;
  name: string;
  surname: string;
  phone: string | null;
  phone2: string | null;
  email: string | null;
  /** yyyy-mm-dd */
  birthdate: string | null;
  /** Path in the private `rider-photos` bucket; resolve to a signed URL on demand. */
  avatarPath: string | null;
  /** Null until staff sells them a plan (e.g. a bulk-imported contact). */
  planId: string | null;
  createdAt: string;
  /** Created through /registracija rather than by staff (ADR-0043). */
  selfRegistered: boolean;
}

/** A physical bracelet (USB IC/RFID reader UID) bound to a rider. One bracelet -> one rider. */
export interface RiderCard {
  cardNumber: string;
  riderId: string;
  boundAt: string;
}

/** One open/closed interval of a rider being out on the water, started and ended by scanning their bracelet (/admin/instruktorius). `endedAt` null = still out. */
export interface RiderSession {
  id: string;
  riderId: string;
  cardNumber: string;
  startedAt: string;
  endedAt: string | null;
}

/** One plan sold to a rider ("sales"): a snapshot, so later plan edits/deletes never rewrite history. */
export interface Purchase {
  id: string;
  riderId: string;
  planId: string | null;
  planName: string;
  planCategory: RidePlanCategory;
  price: number | null;
  soldAt: string;
}

/** A staff note on a rider. */
export interface RiderComment {
  id: string;
  riderId: string;
  text: string;
  authorName: string;
  createdAt: string;
}

/** A file attached to a rider (ID scan, signed waiver, …), stored in the private `rider-documents` bucket. */
export interface RiderDocument {
  id: string;
  riderId: string;
  filePath: string;
  fileName: string;
  uploadedAt: string;
}

/** A signed copy of the park rules from a /registracija self-registration (ADR-0043). */
export interface RiderWaiver {
  id: string;
  riderId: string;
  termsVersion: string;
  /** Path in the private `rider-waivers` bucket; null if the upload failed. */
  signaturePath: string | null;
  signedAt: string;
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
  /** Linked customer (Klientai), the buyer, when matched or created. ADR-0042 */
  riderId?: string;
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
  /** All sauna masters (pirtininkai) incl. hidden ones, in display order. */
  saunaMasters: SaunaMaster[];
  /** All sauna programs incl. hidden ones, in display order. */
  programs: SaunaProgram[];
  coupons: Coupon[];
  couponProducts: CouponProduct[];
  /** Empty without the `nuolaidos` permission (or before its migration). */
  discountCodes: DiscountCode[];
  /** Cabin sizes and camper pitches, hidden ones included (owner-managed at /admin/namukai). */
  stayTypes: StayType[];
  quadTypes: QuadType[];
  quadSettings: QuadSettings;
  /** Mini / Midi / Maxi, all of them (inactive too) for staff with `keturraciai`. */
  quadTourRoutes: QuadTourRoute[];
  quadTourAccessories: QuadTourAccessory[];
  quadRentals: QuadRental[];
  tourTickets: TourTicket[];
  /** Seat requests for public sauna sessions and other limited events (not quad tours). */
  eventTickets: TourTicket[];
  /** The signed-in staff member. */
  me: StaffAccess;
  roles: StaffRole[];
  /** Empty unless `me` is an owner. */
  staff: StaffMember[];
  /** Empty unless `me` is an owner (or before the notification_recipients migration). */
  notificationRecipients: NotificationRecipient[];
  /** Site-wide switches; owners only (null for everyone else, or before the site_settings migration). */
  siteSettings: SiteSettings | null;
  ridePlans: RidePlan[];
  riders: Rider[];
  riderCards: RiderCard[];
  /** Empty without the `instruktorius` permission. */
  riderSessions: RiderSession[];
  purchases: Purchase[];
  riderComments: RiderComment[];
  riderDocuments: RiderDocument[];
  riderWaivers: RiderWaiver[];
}
