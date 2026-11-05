import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ComingSoon } from "@/components/coming-soon";
import { gateCode, siteGateOn } from "@/lib/site-gate";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Netrukus - Vanduo Marse",
  description: "Kuriame naują Vanduo Marse svetainę. Rezervacijų ir klausimų laukiame telefonu ar el. paštu.",
  robots: { index: false, follow: false },
};

/** The gate page (proxy.ts rewrites every public path here with a 503 while SITE_GATE=1). */
export default function NetrukusPage() {
  if (!siteGateOn()) redirect("/");
  return <ComingSoon withCode={Boolean(gateCode())} />;
}
