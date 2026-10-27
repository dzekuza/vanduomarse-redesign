import type { Metadata } from "next";
import { InquiriesView } from "@/components/admin/inquiries/inquiries-view";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Užklausos" };

export default async function AdminInquiriesPage() {
  await requirePermission("uzklausos");
  return <InquiriesView />;
}
