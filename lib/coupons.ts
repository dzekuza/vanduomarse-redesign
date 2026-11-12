/**
 * Gift coupons. Catalogue and orders live in `public.coupon_products` /
 * `public.coupons` (managed in /admin/kuponai); this module holds the shared
 * types and the pure helpers used by the shop, the booking flows and the admin.
 */

/** "verte" = a euro value spendable anywhere; "paslauga" = an experience tied to one service. */
export type CouponKind = "verte" | "paslauga";
export type CouponService = "visi" | "kabelis" | "pirtis" | "miegas";
export type CouponStatus = "laukia_apmokejimo" | "aktyvus" | "panaudotas" | "atsauktas";

/** Services a public booking flow can redeem against. */
export type RedeemableService = Extract<CouponService, "pirtis" | "miegas">;

export interface CouponProduct {
  id: string;
  kind: CouponKind;
  service: CouponService;
  name: string;
  description: string;
  /** Face value in EUR incl. 21% PVM. */
  value: number;
  active: boolean;
}

/** Season passes use the same checkout and are activated in person from the paid coupon code. */
export function isWakeSeasonPass(product: WakeOffer): boolean {
  if (product.planId) return product.planCategory === "Abonementai";
  return product.service === "kabelis" && product.id.startsWith("wake-abonementas-");
}

/**
 * A WAKE offer on the booking pages: a coupon product (rides), or a bracelet plan (season passes, ADR-0080)
 * with `planId` set. Season passes are bought through /registracija, never as a coupon.
 */
export interface WakeOffer extends CouponProduct {
  planId?: string;
  /** The plan's category (`Plaukimas` = rides, `Abonementai` = season passes); set with `planId`. */
  planCategory?: string;
}

/** What a customer learns about a code: its remaining balance and scope, nothing about the buyer. */
export interface CheckedCoupon {
  /** Normalised, 12 characters. */
  code: string;
  balance: number;
  service: CouponService;
  /** yyyy-mm-dd */
  expiresAt: string;
  productName: string;
}

export const COUPON_SERVICE_LABEL: Record<CouponService, string> = {
  visi: "Bet kuri paslauga",
  kabelis: "Plaukimas kabeline trasa",
  pirtis: "Pirtis Marse",
  miegas: "Miegas Marse",
};

export const COUPON_STATUS_LABEL: Record<CouponStatus, string> = {
  laukia_apmokejimo: "Laukia apmokėjimo",
  aktyvus: "Aktyvus",
  panaudotas: "Panaudotas",
  atsauktas: "Atšauktas",
};

/** Months a paid coupon stays valid (enforced in `activate_coupon()`). */
export const COUPON_VALID_MONTHS = 12;

export const COUPON_CODE_LENGTH = 12;

/** Strips everything but letters and digits and uppercases, so "ab12-cd34 ef56" matches "AB12CD34EF56". */
export const normalizeCode = (input: string) => input.replace(/[^a-z0-9]/gi, "").toUpperCase();

/** "AB12CD34EF56" -> "AB12-CD34-EF56". */
export function formatCode(code: string): string {
  return normalizeCode(code).replace(/(.{4})(?=.)/g, "$1-");
}

/** Whether a coupon issued for `couponService` can pay for a booking in `flow`. */
export const couponApplies = (couponService: CouponService, flow: RedeemableService) =>
  couponService === "visi" || couponService === flow;

/** Euros a coupon takes off `total`: never more than the balance or the total. */
export const couponDiscount = (total: number, balance: number) => Math.max(0, Math.min(total, balance));

/** "2027-10-27" -> "2027 m. spalio 27 d." for emails and receipts. */
export function formatExpiry(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("lt-LT", { timeZone: "UTC", year: "numeric", month: "long", day: "numeric" });
}

/** 25 -> "25 €", 140.5 -> "140,50 €". */
export const formatEuro = (n: number) =>
  `${n.toLocaleString("lt-LT", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })} €`;
