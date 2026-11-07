import type { Metadata } from "next";
import { ApyrankesView } from "@/components/admin/apyrankes/apyrankes-view";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Apyrankės" };

export default async function AdminApyrankesPage() {
  await requirePermission("apyrankes");
  return <ApyrankesView />;
}
