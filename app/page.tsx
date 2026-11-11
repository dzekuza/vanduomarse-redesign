import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { pageMetadata } from "@/lib/seo";
import { localBusinessSchema, faqSchema } from "@/lib/structured-data";
import { MainHeader } from "@/components/main-header";
import { SiteFooter } from "@/components/site-footer";
import { LandingActivities } from "@/components/landing/landing-activities";
import { LandingAllIn } from "@/components/landing/landing-all-in";
import { FAQ_ITEMS } from "@/components/landing/content";
import { LandingFaq } from "@/components/landing/landing-faq";

import { LandingHero } from "@/components/landing/landing-hero";
import { LandingMoments } from "@/components/landing/landing-moments";
import { LandingNight } from "@/components/landing/landing-night";
import { LandingPlace } from "@/components/landing/landing-place";
import { LandingProvider } from "@/components/landing/landing-provider";
import { LandingTicker } from "@/components/landing/landing-ticker";

export const metadata: Metadata = pageMetadata({
  title: "Vanduo Marse | Pirtis, keturračiai ir vandenlentės prie Kauno",
  absoluteTitle: true,
  description:
    "Pirtis, keturračiai, kabelinis vandenlenčių parkas, šventės ir nakvynė prie vandens Žemaitkiemyje, Kauno rajone. Susiplanuok dieną Vanduo Marse.",
  path: "/",
});

export default function Home() {
  return (
    <LandingProvider>
      <JsonLd data={localBusinessSchema()} />
      <JsonLd data={faqSchema(FAQ_ITEMS)} />
      <a href="#kryptys" className="sr-only focus:not-sr-only focus:fixed focus:top-2.5 focus:left-5 focus:z-50 focus:bg-dust focus:p-3">
        Pereiti prie veiklų
      </a>
      <MainHeader placement="overlay" />
      <main>
        <div className="lg:flex lg:h-svh lg:flex-col">
          <LandingHero />
          <LandingTicker />
        </div>
        <LandingActivities />
        <LandingNight />
        <LandingAllIn />
        <LandingMoments />
        <LandingFaq />
        <LandingPlace />
      </main>
      <SiteFooter />
    </LandingProvider>
  );
}
