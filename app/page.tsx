import { Equipment } from "@/components/equipment";
import { FindUs } from "@/components/find-us";
import { Hero } from "@/components/hero";
import { Pricing } from "@/components/pricing";
import { SiteFooter } from "@/components/site-footer";
import { SectorTiles } from "@/components/sector-tiles";
import { SiteHeader } from "@/components/site-header";
import { StatusBar } from "@/components/status-bar";
import { TrackStats } from "@/components/track-stats";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <Hero />
      <SectorTiles />
      <TrackStats />
      <StatusBar />
      <Equipment />
      <Pricing />
      <FindUs />
      <SiteFooter />
    </>
  );
}
