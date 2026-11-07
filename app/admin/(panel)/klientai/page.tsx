import type { Metadata } from "next";
import { KlientaiView } from "@/components/admin/klientai/klientai-view";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Klientai" };

export default async function AdminKlientaiPage() {
  await requirePermission("klientai");
  return <KlientaiView />;
}
