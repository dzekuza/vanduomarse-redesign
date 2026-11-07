import { formatEuro } from "@/lib/coupons";

/** The /admin/apyrankes plan catalogue's categories, matching the till's tabs (Plaukimas, Įranga, …). */
export const RIDE_PLAN_CATEGORIES = ["Plaukimas", "Įranga", "Abonementai", "Pramogos", "Apgyvendinimas", "Parduotuvė", "Dubenėlyje"] as const;

/** null price (e.g. staff) renders as "—" instead of "0 €". */
export function formatPlanPrice(price: number | null): string {
  return price === null ? "—" : formatEuro(price);
}
