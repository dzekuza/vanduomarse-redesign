import type { Metadata } from "next";
import { PricingView } from "@/components/admin/pricing/pricing-view";

export const metadata: Metadata = { title: "Kainodara" };

export default function AdminPricingPage() {
  return <PricingView />;
}
