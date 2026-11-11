import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { PRIVACY_INTRO, PRIVACY_SECTIONS } from "@/components/legal/privacy-content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privatumo politika",
  description: "Kokius asmens duomenis Vanduo Marse renka rezervacijų, kuponų ir paskyros metu, kam juos naudoja ir kokias teises turi lankytojai.",
  path: "/privatumo-politika",
});

export default function PrivacyPage() {
  return <LegalPage crumb="Privatumo politika" title={["Privatumo", "politika"]} intro={PRIVACY_INTRO} sections={PRIVACY_SECTIONS} />;
}
