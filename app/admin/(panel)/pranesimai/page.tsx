import type { Metadata } from "next";
import { NotificationsView } from "@/components/admin/notifications/notifications-view";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Pranešimai" };

export default async function AdminNotificationsPage() {
  await requirePermission("owner");
  return <NotificationsView />;
}
