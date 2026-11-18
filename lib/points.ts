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
