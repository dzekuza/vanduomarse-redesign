import type { Metadata } from "next";
import { CalendarView } from "@/components/admin/calendar/calendar-view";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Kalendorius" };

export default async function AdminCalendarPage() {
  // Same access as the booking list; each source table is still gated by its own RLS policy (ADR-0012).
  await requirePermission(["rezervacijos", "uzimtumas"]);
  return <CalendarView />;
}
