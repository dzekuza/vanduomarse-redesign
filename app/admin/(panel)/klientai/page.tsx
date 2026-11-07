import type { Metadata } from "next";
import { KlientaiView } from "@/components/admin/klientai/klientai-view";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Klientai" };

export default async function AdminKlientaiPage() {
  // Apyrankės-only staff lose their Naudotojai tab (ADR-0042) without this.
  await requirePermission(["klientai", "apyrankes"]);
  return <KlientaiView />;
}
