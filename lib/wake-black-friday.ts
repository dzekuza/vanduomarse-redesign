import type { CheckedDiscount } from "@/lib/discount-codes";

export const WAKE_BLACK_FRIDAY_PATH = "/registracija/wake/black-friday";
export const WAKE_SEASON_PASS_ID = "52e95927-7591-4feb-99b4-1b92c878ca6c";

// Fallback for local design previews only; live pages use the database row (seeded by migration 20261116174211).
export const WAKE_BLACK_FRIDAY_DISCOUNT = {
  code: "WAKEBLACKFRIDAY2026",
  kind: "procentai",
  value: 10,
  services: ["planai"],
} satisfies CheckedDiscount;

/**
 * The live campaign row: the campaign code, a percentage, valid for plans. The percentage itself is the owner's to change
 * in /admin/nuolaidos, so it is not compared; pages show the database value.
 */
export function isWakeBlackFridayDiscount(discount: CheckedDiscount | null): boolean {
  return discount?.code === WAKE_BLACK_FRIDAY_DISCOUNT.code &&
    discount.kind === WAKE_BLACK_FRIDAY_DISCOUNT.kind &&
    discount.value > 0 &&
    discount.services.includes("planai");
}
