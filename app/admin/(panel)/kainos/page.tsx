import type { Metadata } from "next";
import { PricingView } from "@/components/admin/pricing/pricing-view";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Kainodara" };

export default async function AdminPricingPage() {
  await requirePermission("kainos");
  return <PricingView />;
}
