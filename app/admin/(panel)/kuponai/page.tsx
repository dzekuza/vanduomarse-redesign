import type { Metadata } from "next";
import { CouponsView } from "@/components/admin/coupons/coupons-view";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Kuponai" };

export default async function AdminCouponsPage() {
  await requirePermission("kuponai");
  return <CouponsView />;
}
