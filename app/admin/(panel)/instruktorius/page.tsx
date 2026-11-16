import type { Metadata } from "next";
import { InstruktoriusView } from "@/components/admin/instruktorius/instruktorius-view";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Apyrankių skenavimas" };

export default async function AdminInstruktoriusPage() {
  await requirePermission("instruktorius");
  return <InstruktoriusView />;
}
