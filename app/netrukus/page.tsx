import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ComingSoon } from "@/components/coming-soon";
import { gateCode } from "@/lib/site-gate";
import { siteGateOn } from "@/lib/site-gate-flag";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Netrukus | Vanduo Marse" },
  description: "Kuriame naują Vanduo Marse svetainę. Rezervacijų ir klausimų laukiame telefonu ar el. paštu.",
  robots: { index: false, follow: false },
};

/** The gate page (proxy.ts rewrites every public path here with a 503 while the gate is on). */
export default async function NetrukusPage() {
  if (!(await siteGateOn())) redirect("/");
  return <ComingSoon withCode={Boolean(gateCode())} />;
}
