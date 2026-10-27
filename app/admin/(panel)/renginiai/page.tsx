import type { Metadata } from "next";
import { EventsView } from "@/components/admin/events/events-view";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Renginiai" };

export default async function AdminEventsPage() {
  await requirePermission("renginiai");
  return <EventsView />;
}
