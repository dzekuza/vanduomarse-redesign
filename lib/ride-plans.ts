import { formatEuro } from "@/lib/coupons";

/** The /admin/apyrankes plan catalogue's categories, matching the till's tabs (Plaukimas, Įranga, …). */
export const RIDE_PLAN_CATEGORIES = ["Plaukimas", "Įranga", "Abonementai"] as const;

/**
 * How the categories are shown in /admin/apyrankes: Abonementai has no tab of its own, it is a sub-tab of Plaukimas next to
 * Bilietai (`Plaukimas` plans). The stored categories do not change (season-pass logic reads `Abonementai`).
 */
export const RIDE_PLAN_GROUPS = [
  { label: "Plaukimas", sections: [{ category: "Plaukimas", label: "Bilietai" }, { category: "Abonementai", label: "Abonementai" }] },
  { label: "Įranga", sections: [{ category: "Įranga", label: "Įranga" }] },
] as const satisfies readonly { label: string; sections: readonly { category: (typeof RIDE_PLAN_CATEGORIES)[number]; label: string }[] }[];

/** Category names in forms: the stored category with where it appears. */
export const RIDE_PLAN_CATEGORY_LABELS: Record<(typeof RIDE_PLAN_CATEGORIES)[number], string> = {
  Plaukimas: "Plaukimas: bilietai",
  Abonementai: "Plaukimas: abonementai",
  Įranga: "Įranga",
};

/** How a plan sold at the till was paid: card or cash. Stored on `purchases.payment_method`. */
export const PURCHASE_PAYMENT_METHODS = ["kortele", "grynais"] as const;
export const PURCHASE_PAYMENT_LABELS: Record<(typeof PURCHASE_PAYMENT_METHODS)[number], string> = { kortele: "Kortele", grynais: "Grynaisiais" };

/** null price (e.g. staff) renders as "—" instead of "0 €". */
export function formatPlanPrice(price: number | null): string {
  return price === null ? "—" : formatEuro(price);
}
