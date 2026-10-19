import type { Metadata } from "next";
import { AvailabilityView } from "@/components/admin/availability/availability-view";

export const metadata: Metadata = { title: "Užimtumas" };

export default function AdminAvailabilityPage() {
  return <AvailabilityView />;
}
