import Image from "next/image";
import { Cta } from "@/components/cta";
import { Reveal } from "@/components/reveal";
import { SectionKicker } from "@/components/section-kicker";

/** `#sventes`: full-bleed night photo with the party headline. */
export function LandingNight() {
  return (
    <section id="sventes" aria-labelledby="night-title" className="relative h-182 overflow-hidden bg-ink text-dust md:h-203">
      <Image src="/landing/night.webp" alt="Vakarėlio muzika ir šviesos Vanduo Marse" fill sizes="100vw" className="object-cover object-center" />
      <div aria-hidden className="absolute inset-0 bg-linear-to-r from-ink/90 to-ink/25" />
      <div aria-hidden className="absolute inset-0 bg-linear-to-t from-ink/75 to-transparent to-45%" />
      <div className="relative flex h-full flex-col px-gutter py-8 md:py-12">
        <SectionKicker left="02 / ŠVENTĖS IR RENGINIAI" right="PRIVAČIOMS IR ĮMONIŲ ŠVENTĖMS" />
        <Reveal className="mt-19 md:mt-16.5">
          <h2 id="night-title" className="text-jumbo-sm font-bold md:text-jumbo">
            ČIA NAKTIS
            <br />
            <span className="text-rust">
              NESAKO
              <br />
              „TYLIAU“.
            </span>
          </h2>
        </Reveal>
        <Reveal className="mt-auto md:flex md:items-end md:justify-between md:gap-8 delay-150">
          <p className="max-w-xl text-xs leading-loose">
            Mūsų neriboja garsas, tad Jūsų gimtadienis, vestuvės ar įmonės šventės čia gali skambėti garsiai! Švęskit iki ryto savų žmonių rate.
          </p>
          <Cta tone="cream" href="/sventes#rezervuoti" className="mt-6 max-w-full md:mt-0">
            Skaičiuoti šventės kainą
          </Cta>
        </Reveal>
      </div>
    </section>
  );
}
