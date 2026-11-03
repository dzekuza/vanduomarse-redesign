import type { Metadata } from "next";
import { LandingActivities } from "@/components/landing/landing-activities";
import { LandingAllIn } from "@/components/landing/landing-all-in";
import { LandingFaq } from "@/components/landing/landing-faq";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingMoments } from "@/components/landing/landing-moments";
import { LandingNight } from "@/components/landing/landing-night";
import { LandingPlace } from "@/components/landing/landing-place";
import { LandingProvider } from "@/components/landing/landing-provider";
import { LandingTicker } from "@/components/landing/landing-ticker";

export const metadata: Metadata = {
  title: "Vanduo Marse — Užsuk į Marsą",
  description:
    "Pirtis, keturračiai, vandenlentės, šventės ir nakvynė prie vandens Kauno rajone. Susiplanuok dieną Vanduo Marse.",
};

export default function Home() {
  return (
    <LandingProvider>
      <a href="#kryptys" className="sr-only focus:not-sr-only focus:fixed focus:top-2.5 focus:left-5 focus:z-50 focus:bg-dust focus:p-3">
        Pereiti prie veiklų
      </a>
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingTicker />
        <LandingActivities />
        <LandingNight />
        <LandingAllIn />
        <LandingMoments />
        <LandingFaq />
        <LandingPlace />
      </main>
      <LandingFooter />
    </LandingProvider>
  );
}
