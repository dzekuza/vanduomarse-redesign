import type { Metadata } from "next";
import { NamukaiView } from "@/components/admin/namukai/namukai-view";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Namukai" };

export default async function AdminNamukaiPage() {
  await requirePermission("owner");
  return <NamukaiView />;
}
