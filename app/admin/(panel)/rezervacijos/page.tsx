import type { Metadata } from "next";
import { BookingsView } from "@/components/admin/bookings/bookings-view";

export const metadata: Metadata = { title: "Rezervacijos" };

export default function AdminBookingsPage() {
  return <BookingsView />;
}
