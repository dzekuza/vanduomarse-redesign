import type { CheckedDiscount } from "@/lib/discount-codes";

export const WAKE_BLACK_FRIDAY_PATH = "/registracija/wake/black-friday";
export const WAKE_SEASON_PASS_ID = "52e95927-7591-4feb-99b4-1b92c878ca6c";

// Keep the preview in sync with the campaign row seeded by migration 20261116130000.
export const WAKE_BLACK_FRIDAY_DISCOUNT = {
  code: "WAKEBLACKFRIDAY2026",
  kind: "procentai",
  value: 10,
  services: ["planai"],
} satisfies CheckedDiscount;

export function isWakeBlackFridayDiscount(discount: CheckedDiscount | null): boolean {
  return discount?.code === WAKE_BLACK_FRIDAY_DISCOUNT.code &&
    discount.kind === WAKE_BLACK_FRIDAY_DISCOUNT.kind &&
    discount.value === WAKE_BLACK_FRIDAY_DISCOUNT.value &&
    discount.services.includes("planai");
}
