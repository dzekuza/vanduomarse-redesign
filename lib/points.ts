import { z } from "zod";

/** Points / kreditai (ADR-0121): types, labels and helpers shared by the admin and the customer account. */

export type PointsKind = "earn" | "admin" | "redeem" | "release" | "clawback" | "return";

export const POINTS_KIND_LABEL: Record<PointsKind, string> = {
  earn: "Gauta už pirkinį",
  admin: "Darbuotojo korekcija",
  redeem: "Panaudota atsiskaitant",
  release: "Grąžinta (mokėjimas neįvyko)",
  clawback: "Atšaukta po pinigų grąžinimo",
  return: "Grąžinta po atšaukimo",
};

/** One movement of a balance, newest first in lists. */
export interface PointsEntry {
  delta: number;
  kind: string;
  reason: string;
  /** ISO timestamp. */
  at: string;
}

/** What the owner sets in /admin/svetaine. */
export interface LoyaltySettings {
  enabled: boolean;
  /** Points earned for each euro paid online. */
  earnPointsPerEuro: number;
  /** What one point is worth at checkout, in euros. */
  pointValueEur: number;
}

export const DEFAULT_LOYALTY: LoyaltySettings = { enabled: true, earnPointsPerEuro: 5, pointValueEur: 0.01 };

export const MAX_ADJUST_POINTS = 1_000_000;

/** Staff give (positive) or take (negative) points with a reason. */
export const adjustPointsSchema = z.object({
  delta: z
    .number("Įveskite taškų skaičių.")
    .int("Taškai turi būti sveikas skaičius.")
    .min(-MAX_ADJUST_POINTS, "Per didelė suma.")
    .max(MAX_ADJUST_POINTS, "Per didelė suma.")
    .refine((n) => n !== 0, "Įveskite kiekį, ne nulį."),
  reason: z.string().trim().min(1, "Nurodykite priežastį.").max(200, "Per ilga priežastis."),
});

export const loyaltySettingsSchema = z.object({
  enabled: z.boolean(),
  earnPointsPerEuro: z.number().min(0).max(1000),
  pointValueEur: z.number().gt(0).max(100),
});

export const kindLabel = (kind: string): string => POINTS_KIND_LABEL[kind as PointsKind] ?? kind;

/** "1 250 tšk." */
export const formatPoints = (points: number): string => `${new Intl.NumberFormat("lt-LT").format(points)} tšk.`;

/** The euro value of a number of points, to the cent. */
export const pointsValueEur = (points: number, pointValueEur: number): number => Math.round(points * pointValueEur * 100) / 100;

/** The points a payment earns: whole points only. */
export const earnedPoints = (euros: number, earnPointsPerEuro: number): number =>
  // Whole cents times the rate in hundredths, like the database's exact numeric arithmetic (0.29 EUR at 100 points per EUR is 29, not 28).
  Math.floor((Math.round(euros * 100) * Math.round(earnPointsPerEuro * 100)) / 10_000);

/** What the checkout shows a signed-in customer: points they can spend and what a point is worth. */
export interface SpendablePoints {
  balance: number;
  pointValueEur: number;
  enabled: boolean;
}

/** Stripe refuses payments below this many euros, so points can never take the cash charge under it. */
export const MIN_CASH_CHARGE_EUR = 0.5;

/**
 * Preview of paying with points: the most points that fit (balance, and the cash charge staying at 0.50 EUR) and what they take off.
 * The server computes it again from the live setting; this only fills the checkbox.
 */
export function spendPreview(points: SpendablePoints | null | undefined, payable: number): { points: number; euros: number } {
  if (!points || !points.enabled || points.balance <= 0 || points.pointValueEur <= 0 || payable <= MIN_CASH_CHARGE_EUR) return { points: 0, euros: 0 };
  const fit = Math.floor((Math.round((payable - MIN_CASH_CHARGE_EUR) * 100) / 100) / points.pointValueEur);
  const used = Math.max(0, Math.min(points.balance, fit));
  return { points: used, euros: Math.round(used * points.pointValueEur * 100) / 100 };
}

/**
 * The cash part of a request's total when its payment was partly paid with points: total x cash / (cash + points), to the cent.
 * Matches the share `begin_request_refund` refunds, so the cancel button promises what the database returns.
 */
export function cashShare(total: number, payment: { amount: number; pointsDiscount: number } | null | undefined): number {
  if (!payment || payment.pointsDiscount <= 0) return total;
  return Math.round(((total * payment.amount) / (payment.amount + payment.pointsDiscount)) * 100) / 100;
}
