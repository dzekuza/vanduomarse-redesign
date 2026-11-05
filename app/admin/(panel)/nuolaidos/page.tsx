import type { Metadata } from "next";
import { DiscountCodesView } from "@/components/admin/discounts/discount-codes-view";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Nuolaidos" };

export default async function AdminDiscountsPage() {
  await requirePermission("nuolaidos");
  return <DiscountCodesView />;
}
