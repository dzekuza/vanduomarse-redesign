import type { CouponService } from "@/lib/coupons";
import type { CancelState } from "@/lib/request-cancel";
export type RequestKind = "pirtis" | "nakvyne" | "keturraciai" | "renginys";

/** What the account page shows about one of the customer's requests (a sauna, stay, quad or event reservation). */
export interface MyRequest {
  id: string;
  reference: string;
  title: string;
  /** Which tab of the account page it belongs to. */
  kind: RequestKind;
  detail: string;
  /** yyyy-mm-dd */
  date: string;
  total: number;
  status: "laukia" | "patvirtinta" | "ivykdyta" | "atsaukta";
  /** The Stripe payment status, or null when it was not paid online. */
  payment: "laukia" | "apmoketa" | "pasibaige" | "nepavyko" | "grazinta" | null;
  /** The Stripe payment this request belongs to; lets an unpaid one be paid again or cancelled. */
  paymentId: string | null;
  /** Whether the customer can cancel it themselves (`yes`), only by calling (`late`: paid and under 24 h to go), or not. */
  cancel: CancelState;
  /** What a cancel refunds, in euros (0 when nothing was paid online). */
  refund: number;
}

export const REQUEST_STATUS_LABEL: Record<MyRequest["status"], string> = {
  laukia: "Laukia patvirtinimo",
  patvirtinta: "Patvirtinta",
  ivykdyta: "Įvykdyta",
  atsaukta: "Atšaukta",
};

export const REQUEST_PAYMENT_LABEL: Record<NonNullable<MyRequest["payment"]>, string> = {
  laukia: "Laukia apmokėjimo",
  apmoketa: "Apmokėta",
  pasibaige: "Mokėjimo laikas baigėsi",
  nepavyko: "Mokėjimas nepavyko",
  grazinta: "Grąžinta",
};

/** A calculator quote the customer sent (matched by their confirmed e-mail or phone, see `my_inquiries()`). */
export interface MyInquiry {
  id: string;
  /** ISO timestamp */
  createdAt: string;
  eventType: string;
  /** yyyy-mm-dd, empty when none was chosen */
  date: string;
  guests: number;
  space: string;
  estimate: { min: number; max: number } | null;
  status: "nauja" | "susisiekta" | "pasiulymas";
  /** Staff accepted it and held the cabins and saunas. */
  accepted: boolean;
  /** The comment they wrote. */
  message: string;
  /** The estimate breakdown they were shown, grouped like the calculator. */
  lines: { group: string; label: string; amount: { min: number; max: number } }[];
  contact: { name: string; phone: string; email: string };
}

export const INQUIRY_STATUS_LABEL: Record<MyInquiry["status"], string> = {
  nauja: "Gauta",
  susisiekta: "Susisiekėme",
  pasiulymas: "Pateiktas pasiūlymas",
};

/** The customer's wakeboard rider record (matched by confirmed e-mail or phone, see `my_riders()`): plan, bracelet and purchases. */
export interface MyRider {
  id: string;
  name: string;
  surname: string;
  /** The plan they are on now; null until staff sell them one. */
  plan: { name: string; description: string; category: string; price: number | null } | null;
  /** Bracelet numbers bound to them. */
  cards: string[];
  /** Finished /registracija: a profile photo and a signed waiver. True when unknown (before `my_riders()` reports it). */
  registered: boolean;
  /** What they gave at /registracija; null when the database does not report it yet. */
  registration: {
    email: string;
    phone: string;
    phone2: string;
    /** yyyy-mm-dd, or "". */
    birthdate: string;
    /** Short-lived signed URL of the profile photo, or null. */
    photoUrl: string | null;
    /** When the rules were signed, or null. */
    signedAt: string | null;
    termsVersion: string;
  } | null;
  /** Plans bought, newest first. */
  purchases: { planName: string; category: string; price: number | null; soldAt: string }[];
}

/**
 * Riders to show: once one is registered, unfinished rows with no plan, bracelet or purchase (old attempts, imports) are
 * leftovers and stay hidden, so they neither crowd the tab nor ask the customer to finish a registration they have.
 */
export function visibleRiders(riders: MyRider[]): MyRider[] {
  if (!riders.some((rider) => rider.registered)) return riders;
  return riders.filter((rider) => rider.registered || rider.plan !== null || rider.cards.length > 0 || rider.purchases.length > 0);
}

/** A paid gift coupon the signed-in account bought or was given (matched by confirmed e-mail, see `my_coupons()`). */
export interface MyCoupon {
  reference: string;
  productName: string;
  faceValue: number;
  balance: number;
  status: "aktyvus" | "panaudotas";
  /** Null only for odd legacy rows. */
  code: string | null;
  /** yyyy-mm-dd */
  expiresAt: string | null;
  service: CouponService;
  /** Bought by this account, or sent to it as a gift. */
  role: "buyer" | "recipient";
  buyerName: string;
  recipientName: string;
  message: string;
  /** Checkout Session id: only for coupons this account bought online; opens the PDF page and the resend button. */
  sessionId: string | null;
}
