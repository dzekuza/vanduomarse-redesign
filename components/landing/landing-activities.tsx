import { ActivityBoard } from "./activity-board";
import { Reveal } from "@/components/reveal";
import { SectionKicker } from "@/components/section-kicker";

/** `#kryptys`: heading + the filterable activity grid. */
export function LandingActivities() {
  return (
    <section id="kryptys" aria-labelledby="activities-title" className="px-gutter py-14 md:py-19">
      <Reveal>
        <SectionKicker left="01 / PASIRINK KRYPTĮ" right="VIENA VIETA. DAUG SCENARIJŲ." />
      <div className="mt-8 mb-6 md:mt-12 md:mb-10 md:flex md:items-end md:justify-between md:gap-15">
        <h2 id="activities-title" className="text-display font-bold">
          KĄ ŠIANDIEN
          <br />
          <span className="text-rust">VEIKIAM?</span>
        </h2>
        <p className="mt-6 text-xs leading-loose md:mt-0 md:mb-2">
          Nuo pirmo šuolio iki paskutinio garo.
          <br />
          Susirask savo priežastį išsukti.
        </p>
      </div>
      </Reveal>
      <ActivityBoard />
    </section>
  );
}
