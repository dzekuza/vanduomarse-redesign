import type { Metadata } from "next";
import { BookingsView } from "@/components/admin/bookings/bookings-view";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Rezervacijos" };

export default async function AdminBookingsPage() {
  // Užimtumas-only staff (closing hours) open this page's Kalendorius tab.
  await requirePermission(["rezervacijos", "uzimtumas"]);
  return <BookingsView />;
}
