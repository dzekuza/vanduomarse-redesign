import type { Metadata } from "next";
import { QuadsView } from "@/components/admin/quads/quads-view";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Keturračiai" };

export default async function AdminQuadsPage() {
  await requirePermission("keturraciai");
  return <QuadsView />;
}
