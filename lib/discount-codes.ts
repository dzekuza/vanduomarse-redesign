/**
 * Discount codes (ADR-0036): promotions, separate from gift coupons. The database
 * (`private.apply_discount_code`) prices them on every booking; this module only
 * mirrors that rule for the checkout preview and the admin screen.
 */

export type DiscountKind = "procentai" | "suma";

/** The services a code can cover; the same ids as the reservation activities. */
export const DISCOUNT_SERVICES = ["pirtis", "nakvyne", "keturraciai"] as const;
export type DiscountService = (typeof DISCOUNT_SERVICES)[number];

export const DISCOUNT_SERVICE_LABEL: Record<DiscountService, string> = {
  pirtis: "Pirtis",
  nakvyne: "Nakvynė",
  keturraciai: "Keturračiai",
};

export const DISCOUNT_KIND_LABEL: Record<DiscountKind, string> = {
  procentai: "Procentai",
  suma: "Suma, €",
};

export const DISCOUNT_CODE_MIN = 3;
export const DISCOUNT_CODE_MAX = 30;

/** What the checkout learns about a valid code. */
export interface CheckedDiscount {
  code: string;
  kind: DiscountKind;
  value: number;
  services: DiscountService[];
}

/** A code as staff manage it in /admin/nuolaidos. */
export interface DiscountCode extends CheckedDiscount {
  id: string;
  /** yyyy-mm-dd or null */
  validFrom: string | null;
  validUntil: string | null;
  maxUses: number | null;
  active: boolean;
  note: string;
  createdAt: string;
  /** Requests holding the code that are not cancelled. */
  uses: number;
  /** Euros those requests got off. */
  discountTotal: number;
}

/** Upper case letters and digits, like the database stores it. */
export const normalizeDiscountCode = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, "");

export const isDiscountService = (value: string): value is DiscountService => (DISCOUNT_SERVICES as readonly string[]).includes(value);

/** Euros a code takes off one activity's subtotal (the database rounds the same way). */
export function discountFor(discount: Pick<CheckedDiscount, "kind" | "value" | "services">, service: DiscountService, subtotal: number): number {
  if (!discount.services.includes(service) || subtotal <= 0) return 0;
  const amount = discount.kind === "procentai" ? (subtotal * discount.value) / 100 : Math.min(discount.value, subtotal);
  return Math.round(amount * 100) / 100;
}

/** "10 %" or "5 €". */
export const discountValueLabel = (discount: Pick<CheckedDiscount, "kind" | "value">) =>
  discount.kind === "procentai" ? `${discount.value} %` : `${discount.value} €`;

export const discountServicesLabel = (services: DiscountService[]) =>
  services.length === DISCOUNT_SERVICES.length ? "Visos paslaugos" : services.map((s) => DISCOUNT_SERVICE_LABEL[s]).join(", ");

export type DiscountState = "aktyvus" | "isjungtas" | "nebegalioja" | "dar_negalioja" | "isnaudotas";

export const DISCOUNT_STATE_LABEL: Record<DiscountState, string> = {
  aktyvus: "Galioja",
  isjungtas: "Išjungtas",
  nebegalioja: "Pasibaigęs",
  dar_negalioja: "Dar negalioja",
  isnaudotas: "Išnaudotas",
};

/** Whether customers can use the code today (`today` is a Vilnius yyyy-mm-dd). */
export function discountState(code: DiscountCode, today: string): DiscountState {
  if (!code.active) return "isjungtas";
  if (code.validUntil && code.validUntil < today) return "nebegalioja";
  if (code.validFrom && code.validFrom > today) return "dar_negalioja";
  if (code.maxUses !== null && code.uses >= code.maxUses) return "isnaudotas";
  return "aktyvus";
}
