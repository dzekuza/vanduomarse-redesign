import type { Metadata } from "next";
import { SaunaView } from "@/components/admin/sauna/sauna-view";

export const metadata: Metadata = { title: "Pirtis" };

export default function AdminSaunaPage() {
  return <SaunaView />;
}
