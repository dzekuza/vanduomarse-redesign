import type { Metadata } from "next";
import { InquiriesView } from "@/components/admin/inquiries/inquiries-view";

export const metadata: Metadata = { title: "Užklausos" };

export default function AdminInquiriesPage() {
  return <InquiriesView />;
}
