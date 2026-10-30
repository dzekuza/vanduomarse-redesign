import type { Metadata } from "next";
import { SaunaEditor } from "@/components/admin/sauna/sauna-editor";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Pirtis" };

export default async function AdminSaunaEditPage({ params }: PageProps<"/admin/pirtis/[id]">) {
  await requirePermission("pirtis");
  const { id } = await params;
  return <SaunaEditor id={id} />;
}
