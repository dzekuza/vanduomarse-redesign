import Image from "next/image";
import { MAIN_CONTACT, MAPS_URL, telHref } from "@/lib/contacts";
import { PARK_ADDRESS } from "./content";
import { Cta } from "@/components/cta";
import { Reveal } from "@/components/reveal";
import { SectionKicker } from "@/components/section-kicker";

/** `#vieta`: teal block with the aerial photo, address, route and phone. */
export function LandingPlace() {
  return (
    <section id="vieta" aria-labelledby="landing-title" className="grid items-center gap-9 bg-lake-soft px-gutter py-14 text-dust md:py-19 lg:grid-cols-2 lg:gap-17">
      <Reveal>
      <div className="relative h-82 overflow-hidden md:h-138">
        <Image src="/landing/aerial.webp" alt="Marso parkas iš oro, Kauno rajone" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover object-[60%_center]" />
        <span aria-hidden className="absolute top-5 left-5 -rotate-8 bg-rust px-4.5 py-3 text-xs font-bold text-ink md:top-7.5 md:left-7.5">
          ↘ ČIA MARSE.
        </span>
      </div>
      </Reveal>
      <Reveal className="delay-150">
        <SectionKicker left="06 / NUSILEIDIMO VIETA" />
        <h2 id="landing-title" className="mt-6 text-title font-bold md:mt-8">
          MARSAS
          <br />
          <span className="text-lake">
            ARČIAU,
            <br />
            NEI MANAI.
          </span>
        </h2>
        <address className="my-6 text-xs leading-loose not-italic">
          {PARK_ADDRESS.street}, {PARK_ADDRESS.village}
          <br />
          {PARK_ADDRESS.area}
        </address>
        <Cta tone="cream" href={MAPS_URL}>
          Rodyti maršrutą
        </Cta>
        <a href={telHref(MAIN_CONTACT.phone)} className="mt-4 inline-flex min-h-11 items-center text-xs md:text-sm">
          {MAIN_CONTACT.phone}
        </a>
      </Reveal>
    </section>
  );
}
