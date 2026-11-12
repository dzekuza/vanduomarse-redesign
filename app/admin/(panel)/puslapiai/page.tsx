import type { Metadata } from "next";
import { PageContentView } from "@/components/admin/page-content/page-content-view";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Puslapiai" };

export default async function AdminPageContentPage() {
  await requirePermission("owner");
  return <PageContentView />;
}
