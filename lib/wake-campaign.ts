import "server-only";
import { checkDiscountCode } from "@/app/actions/discount-codes";
import { normalizeDiscountCode } from "@/lib/discount-codes";
import { isWakeBlackFridayDiscount, WAKE_BLACK_FRIDAY_DISCOUNT, WAKE_SEASON_PASS_ID } from "@/lib/wake-black-friday";

export const CAMPAIGN_UNAVAILABLE = "Šiuo metu „Black Friday“ pasiūlymas negalioja.";

/**
 * The Black Friday code only works for the WAKE season pass and while the campaign row is live. Returns an error message,
 * or null when the code is not the campaign code (the database then judges it) or the campaign is fine.
 */
export async function campaignDiscountError(planId: string, discountCode?: string): Promise<string | null> {
  const campaign = WAKE_BLACK_FRIDAY_DISCOUNT;
  if (!discountCode || normalizeDiscountCode(discountCode) !== campaign.code) return null;
  if (planId.toLowerCase() !== WAKE_SEASON_PASS_ID) return CAMPAIGN_UNAVAILABLE;
  const result = await checkDiscountCode(campaign.code);
  return "data" in result && isWakeBlackFridayDiscount(result.data) ? null : CAMPAIGN_UNAVAILABLE;
}
