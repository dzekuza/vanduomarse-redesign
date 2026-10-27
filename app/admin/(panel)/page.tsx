import type { Metadata } from "next";
import { Overview } from "@/components/admin/overview/overview";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Apžvalga" };

export default async function AdminOverviewPage() {
  await requirePermission("apzvalga");
  return <Overview />;
}
