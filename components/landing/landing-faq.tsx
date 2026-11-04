import { FAQ_ITEMS, MAIN_CONTACT_EMAIL } from "./content";
import { LandingAccordion } from "./landing-accordion";
import { Reveal } from "@/components/reveal";
import { SectionKicker } from "@/components/section-kicker";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";

const ROWS = FAQ_ITEMS.map((f, i) => ({ id: `faq-${i}`, title: f.q, body: f.a }));

/** `#klausimai`: heading on the left, multi-open accordion on the right. */
export function LandingFaq() {
  return (
    <section id="klausimai" aria-labelledby="faq-title" className="grid gap-9 px-gutter py-14 md:py-25 lg:grid-cols-2 lg:gap-20">
      <Reveal>
        <SectionKicker left="05 / PRIEŠ NUSILEIDŽIANT" />
        <h2 id="faq-title" className="mt-8 text-title font-bold md:mt-11">
          GERAS
          <br />
          <span className="text-rust">KLAUSIMAS.</span>
        </h2>
        <p className="mt-7 text-xs leading-loose">
          Neradai atsakymo?
          <br />
          <a href={`mailto:${MAIN_CONTACT_EMAIL}`} className="inline-flex min-h-11 items-center gap-1 border-b border-line">
            Parašyk mums
            <ArrowUpRightIcon aria-hidden className="size-4" />
          </a>
        </p>
      </Reveal>
      <Reveal className="delay-150">
        <LandingAccordion rows={ROWS} variant="faq" mode="multiple" />
      </Reveal>
    </section>
  );
}
