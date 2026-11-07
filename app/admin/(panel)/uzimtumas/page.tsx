import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/admin/guard";

// Užimtumas is now the Rezervacijos page's "Kalendorius" tab; keep the old link working.
export default async function AdminAvailabilityPage() {
  await requirePermission("uzimtumas");
  redirect("/admin/rezervacijos?view=kalendorius");
}
