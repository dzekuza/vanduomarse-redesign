import type { Metadata } from "next";
import { RiderPage } from "@/components/admin/apyrankes/rider-page";
import { requirePermission } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Naudotojas" };

export default async function AdminRiderPage({ params }: PageProps<"/admin/apyrankes/[id]">) {
  await requirePermission("apyrankes");
  const { id } = await params;
  return <RiderPage id={id} />;
}
