import type { Metadata } from "next";
import { SiteSettingsView } from "@/components/admin/site-settings/site-settings-view";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Svetainė" };

export default async function AdminSiteSettingsPage() {
  await requirePermission("owner");
  return <SiteSettingsView />;
}
