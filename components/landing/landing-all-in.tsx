import { EVENT_OPTIONS } from "./content";
import { LandingAccordion } from "./landing-accordion";
import { ServiceTextCta } from "./service-triggers";
import { Reveal } from "@/components/reveal";
import { SectionKicker } from "@/components/section-kicker";

const ROWS = EVENT_OPTIONS.map((e) => ({ id: e.n, index: e.n, title: e.title, body: e.body }));

/** Coral "everything in one orbit" block: statement left, event options accordion right. */
export function LandingAllIn() {
  return (
    <section aria-labelledby="allin-title" className="relative overflow-hidden bg-rust px-gutter py-14 text-on-rust md:py-19">
      <div aria-hidden className="pointer-events-none absolute -bottom-88 -left-82 size-162 rounded-full border border-ink/25" />
      <SectionKicker left="03 / RŪPESČIUS PALIKITE MUMS" right="DAUGIAU LAIKO KARTU" />
      <div className="relative mt-9 grid items-start gap-10 md:mt-16 md:grid-cols-2 md:gap-22">
        <Reveal>
          <h2 id="allin-title" className="text-statement-sm font-bold md:text-statement">
            VISKAS
            <br />
            VIENOJE
            <br />
            <span className="text-dust">ORBITOJE.</span>
          </h2>
          <p className="mt-7 mb-3 max-w-102 text-xs leading-loose">
            Jums nereikia derinti kelių skirtingų vietų – pasakykite, ką švenčiate, o mes pateiksime Jums
            paruoštą planą.
          </p>
          <ServiceTextCta service="party">Gauti pasiūlymą</ServiceTextCta>
        </Reveal>
        <Reveal className="delay-150">
          <LandingAccordion rows={ROWS} variant="events" mode="single" />
        </Reveal>
      </div>
    </section>
  );
}
