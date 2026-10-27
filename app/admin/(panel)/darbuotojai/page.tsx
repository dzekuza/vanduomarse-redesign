import type { Metadata } from "next";
import { StaffView } from "@/components/admin/staff/staff-view";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Darbuotojai" };

export default async function AdminStaffPage() {
  await requirePermission("owner");
  return <StaffView />;
}
