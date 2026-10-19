import type { Metadata } from "next";
import { EventsView } from "@/components/admin/events/events-view";

export const metadata: Metadata = { title: "Renginiai" };

export default function AdminEventsPage() {
  return <EventsView />;
}
