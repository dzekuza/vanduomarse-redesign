import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ApyrankesView } from "@/components/admin/apyrankes/apyrankes-view";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Apyrankės" };

export default async function AdminApyrankesPage({ searchParams }: PageProps<"/admin/apyrankes">) {
  await requirePermission("apyrankes");
  // The Naudotojai tab moved to Klientai (ADR-0042); keep the old link working.
  if ((await searchParams).tab === "nariai") redirect("/admin/klientai");
  return <ApyrankesView />;
}
