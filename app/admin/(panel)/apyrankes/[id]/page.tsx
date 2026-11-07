import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/admin/guard";

// Naudotojas is now the Klientai profile (ADR-0042); keep the old link working.
export default async function AdminRiderPage({ params }: PageProps<"/admin/apyrankes/[id]">) {
  await requirePermission("apyrankes");
  const { id } = await params;
  redirect(`/admin/klientai/${id}`);
}
