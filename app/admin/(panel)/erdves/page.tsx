import type { Metadata } from "next";
import { SpacesView } from "@/components/admin/spaces/spaces-view";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Erdvės" };

export default async function AdminSpacesPage() {
  await requirePermission(["rezervacijos", "kainos"]);
  return <SpacesView />;
}
