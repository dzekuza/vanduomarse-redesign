import { z } from "zod";
import { MIN_CHARGE_EUR } from "@/lib/payments";
import { WAKE_SEASON_PASS_ID } from "@/lib/wake-black-friday";

/** Same alphabet and length as coupon codes (`private.generate_coupon_code`). */
export const PASS_CODE_LENGTH = 12;

/** "ABCD-EFGH-IJKL": easier to read out and to type than 12 run-together characters. */
export function formatPassCode(code: string): string {
  return code.match(/.{1,4}/g)?.join("-") ?? code;
}

/** What a person types in (spaces, dashes, lower case) reduced to the stored code. */
export function normalizePassCode(input: string): string {
  return input.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

/** A pass bought online without registering; staff attach it to a registered rider at the park (ADR-0109). */
export const PASS_STATUS = ["laukia_apmokejimo", "dalinai_apmoketa", "apmoketa", "priskirtas", "atsauktas"] as const;
export type PassStatus = (typeof PASS_STATUS)[number];

export const PASS_STATUS_LABELS: Record<PassStatus, string> = {
  laukia_apmokejimo: "Laukia apmokėjimo",
  dalinai_apmoketa: "Apmokėta dalis",
  apmoketa: "Apmokėtas, nepriskirtas",
  priskirtas: "Priskirtas",
  atsauktas: "Atšauktas",
};

/** "Visa suma" or "Mokėti dalimis" (ADR-0139): half of the final price now, the rest later by a link staff send. */
export const PASS_PAYMENT_PLANS = ["visa", "dalimis"] as const;
export type PassPaymentPlan = (typeof PASS_PAYMENT_PLANS)[number];

/** Rounds to the cent the way the database does (`round(x, 2)`), without binary float drift. */
const cents = (eur: number) => Math.round(eur * 100);

/**
 * The two halves of a split pass, of the final price (after any discount): the deposit is half rounded to the cent, the
 * balance the rest. The same arithmetic as `create_plan_pass`, so the form shows what Stripe will charge.
 */
export function splitPassPrice(price: number): { deposit: number; balance: number } {
  const total = cents(price);
  const deposit = Math.round(total / 2);
  return { deposit: deposit / 100, balance: (total - deposit) / 100 };
}

/** Only the WAKE season pass can be paid in parts, and only when both halves meet the card minimum (0,50 €). */
export function canPayInParts(planId: string, price: number): boolean {
  if (planId !== WAKE_SEASON_PASS_ID) return false;
  const { deposit, balance } = splitPassPrice(price);
  return deposit >= MIN_CHARGE_EUR && balance >= MIN_CHARGE_EUR;
}

/** The money a pass has actually brought in, after refunds: what the sales list counts as revenue. */
export function passPaidAmount(p: {
  status: PassStatus;
  paymentPlan: PassPaymentPlan;
  price: number;
  depositAmount: number | null;
  balanceAmount: number | null;
  paidAt: string | null;
  balancePaidAt: string | null;
  refundedAt: string | null;
  depositRefundedAt: string | null;
  balanceRefundedAt: string | null;
}): number {
  if (p.status === "laukia_apmokejimo" || p.status === "atsauktas" || !p.paidAt) return 0;
  if (p.paymentPlan === "visa") return p.refundedAt ? 0 : p.price;
  const deposit = p.depositRefundedAt ? 0 : (p.depositAmount ?? 0);
  const balance = p.balancePaidAt && !p.balanceRefundedAt ? (p.balanceAmount ?? 0) : 0;
  return (cents(deposit) + cents(balance)) / 100;
}

/** What the buyer still owes: the balance of a part-paid pass, else nothing. */
export const passOwedAmount = (p: { status: PassStatus; balanceAmount: number | null }): number =>
  p.status === "dalinai_apmoketa" ? (p.balanceAmount ?? 0) : 0;

/** Checkout form shape, shared by the pass buy form and the `buyPlanPass` action. */
export const planPassSchema = z.object({
  planId: z.uuid("Netinkamas abonementas."),
  buyerName: z.string().trim().min(2, "Įveskite vardą").max(80, "Per ilgas vardas"),
  buyerEmail: z.email("Neteisingas el. paštas").max(120),
  /** "Perku draugui": the code is meant to be handed on. */
  gift: z.boolean(),
  /** Optional, gift only: only names the friend in the e-mail. */
  recipientName: z.string().trim().max(80, "Per ilgas vardas"),
  /** "dalimis" only for the WAKE season pass; the server refuses it for any other plan. */
  paymentPlan: z.enum(PASS_PAYMENT_PLANS),
  /** Optional discount code; the database validates it and sets the price. */
  discountCode: z.string().trim().max(40).optional(),
  /** Honeypot: real visitors never see or fill it. Not rejected here: the action answers a filled one like any failure and stores nothing. */
  website: z.string().optional(),
});

export type PlanPassInput = z.infer<typeof planPassSchema>;
