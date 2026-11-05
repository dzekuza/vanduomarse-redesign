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
  /** Requests holding the code that are not cancelled; null when the usage could not be read. */
  uses: number | null;
  /** Euros those requests got off; null when the usage could not be read. */
  discountTotal: number | null;
}

/** Upper case letters and digits, like the database stores it. */
export const normalizeDiscountCode = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, "");

export const isDiscountService = (value: string): value is DiscountService => (DISCOUNT_SERVICES as readonly string[]).includes(value);

const toCents = (euros: number) => Math.round(euros * 100);

/**
 * Euros a code takes off one activity's subtotal. Integer cents, so it matches the database's
 * `round(subtotal * value / 100, 2)` (half away from zero) instead of drifting with floats.
 */
export function discountFor(discount: Pick<CheckedDiscount, "kind" | "value" | "services">, service: DiscountService, subtotal: number): number {
  if (!discount.services.includes(service) || subtotal <= 0) return 0;
  const subtotalCents = toCents(subtotal);
  if (discount.kind === "suma") return Math.min(toCents(discount.value), subtotalCents) / 100;
  // cents × (percent × 100) / 10 000, rounded half up on exact integers.
  return Math.floor((subtotalCents * toCents(discount.value) + 5000) / 10000) / 100;
}

/** Whether a code covers an activity of the plan (and so goes with that activity's request). */
export const discountCovers = (discount: Pick<CheckedDiscount, "services"> | null | undefined, service: string) =>
  !!discount && isDiscountService(service) && discount.services.includes(service);

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
  if (code.maxUses !== null && code.uses !== null && code.uses >= code.maxUses) return "isnaudotas";
  return "aktyvus";
}

const DATE_WITH_YEAR = new Intl.DateTimeFormat("lt-LT", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

/** "2026 m. lapkričio 5 d." for a yyyy-mm-dd, with the year (codes can run across years). */
export const discountDateLabel = (date: string) => DATE_WITH_YEAR.format(new Date(`${date}T00:00:00Z`));
