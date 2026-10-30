import type { Metadata } from "next";
import { SaunaEditor } from "@/components/admin/sauna/sauna-editor";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Nauja pirtis" };

export default async function AdminNewSaunaPage() {
  await requirePermission("pirtis");
  return <SaunaEditor />;
}
