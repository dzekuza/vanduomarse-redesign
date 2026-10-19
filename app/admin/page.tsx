import type { Metadata } from "next";
import { Overview } from "@/components/admin/overview/overview";

export const metadata: Metadata = { title: "Apžvalga" };

export default function AdminOverviewPage() {
  return <Overview />;
}
