import type { Metadata } from "next";
import { AvailabilityView } from "@/components/admin/availability/availability-view";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Užimtumas" };

export default async function AdminAvailabilityPage() {
  await requirePermission("uzimtumas");
  return <AvailabilityView />;
}
