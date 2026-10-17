import { AtmosphereStrip } from "@/components/atmosphere-strip";
import { Hero } from "@/components/hero";
import { MissionPatches } from "@/components/mission-patches";
import { Pricing } from "@/components/pricing";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StatusBar } from "@/components/status-bar";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <Hero />
      <StatusBar />
      <AtmosphereStrip />
      <MissionPatches />
      <Pricing />
      <SiteFooter />
    </>
  );
}
