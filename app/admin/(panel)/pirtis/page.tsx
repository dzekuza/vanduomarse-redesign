import type { Metadata } from "next";
import { SaunaView } from "@/components/admin/sauna/sauna-view";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Pirtys" };

export default async function AdminSaunaPage() {
  await requirePermission("pirtis");
  return <SaunaView />;
}
