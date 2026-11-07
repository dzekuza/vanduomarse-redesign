import type { Metadata } from "next";
import { CustomerPage } from "@/components/admin/klientai/customer-page";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Klientas" };

export default async function AdminCustomerPage({ params }: PageProps<"/admin/klientai/[id]">) {
  // Apyrankės-only staff still open rider profiles here (ADR-0042).
  await requirePermission(["klientai", "apyrankes"]);
  const { id } = await params;
  return <CustomerPage id={id} />;
}
