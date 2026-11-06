import { ArrowDownIcon, ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { StarMark } from "@/components/star-mark";
import { telHref } from "@/lib/contacts";
import { PARK_ADDRESS } from "./content";
import { HeroOrbits } from "./hero-orbits";

/** Load sequence: each block fades up in turn (see delays); skipped under reduced motion. */
const ENTER = "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700 motion-safe:ease-out-strong motion-safe:fill-mode-both";
const HERO_PHONE = "+370 640 57504";

/** Dark hero: grid, cut photo, the "Užsuk į Marsą" headline and the planner sticker. */
export function LandingHero() {
  return (
    <section
      id="pradzia"
      aria-labelledby="hero-title"
      className="relative h-212 overflow-hidden bg-ink px-gutter text-dust md:h-svh md:max-h-235 md:min-h-215 lg:h-auto lg:min-h-0 lg:max-h-none lg:flex-1"
    >
      <div aria-hidden className="absolute inset-0 bg-grid-hero opacity-10" />

      <HeroOrbits />

      <div className="absolute top-82 right-0 bottom-36 w-full overflow-hidden bg-lake-soft clip-hero-narrow md:top-35 md:bottom-24 md:w-3/4 md:clip-hero-wide lg:w-2/3">
        <Image src="/landing/wake.webp" alt="Vandenlentininkas šuolyje virš Marso vandens" fill priority sizes="(min-width: 1024px) 67vw, 100vw" className="object-cover object-center saturate-80 motion-safe:animate-in motion-safe:zoom-in-105 motion-safe:duration-1000 motion-safe:ease-out-strong" />
        <div aria-hidden className="absolute inset-0 bg-linear-to-t from-ink/85 to-transparent to-70% md:bg-linear-to-r md:from-ink/80 md:via-ink/10 md:to-transparent" />
      </div>

      <p className={`absolute top-30 left-gutter z-3 text-micro md:top-37.5 md:text-xs lg:top-hero-kicker ${ENTER} motion-safe:delay-100`}>
        ŽEMĖ TA PATI. JAUSMAS KITAS.
      </p>

      <h1 id="hero-title" className={`absolute top-42 left-gutter z-3 -ml-1.5 text-hero-sm md:top-53 md:text-hero lg:top-hero-title ${ENTER} motion-safe:slide-in-from-bottom-8 motion-safe:delay-150 motion-safe:duration-800`}>
        UŽSUK
        <br />
        <span className="text-rust">Į MARSĄ.</span>
        <StarMark className="absolute motion-safe:animate-spin-slow -top-2 right-2.5 size-8 text-rust md:top-1.5 md:-right-24 md:size-19" />
      </h1>

      <div className={`absolute inset-x-gutter bottom-39 z-4 md:flex md:items-end md:justify-between lg:bottom-hero-actions ${ENTER} motion-safe:slide-in-from-bottom-4 motion-safe:delay-350`}>
        <p className="max-w-105 text-xs leading-loose md:text-sm">
          Vandenlenčių ir pramogų parkas – vos 20 min. nuo Kauno centro. Švenčių erdvės, pirtys, keturračiai, maistas ir nakvynė.
        </p>
        <Link href="#kryptys" className="group/cta mt-4 inline-flex min-h-11 transition-opacity duration-150 active:opacity-70 items-center gap-6 border-b border-current py-2.5 text-xs font-bold md:mr-5 md:mt-0">
          Ką gali rezervuoti?
          <ArrowDownIcon aria-hidden className="size-6 transition-transform motion-safe:group-hover/cta:translate-y-1" />
        </Link>
      </div>

      <div className="absolute top-90 left-7 z-5 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-90 motion-safe:duration-700 motion-safe:delay-500 motion-safe:ease-out-strong motion-safe:fill-mode-both md:top-45 md:right-gutter md:left-auto lg:top-hero-kicker lg:mt-7.5">
        <Link
          href="/rezervacija"
          aria-label="Rezervuok laiką Marse"
          className="@container grid size-30 rotate-12 place-items-center rounded-full border border-ink bg-rust text-center font-bold text-ink ring-7 ring-rust motion-safe:transition-[rotate,scale] motion-safe:duration-150 motion-safe:ease-out-strong motion-safe:hover:rotate-0 motion-safe:active:scale-95 md:size-32 lg:size-41"
        >
          <span className="grid justify-items-center gap-hero-sticker-gap text-hero-sticker whitespace-nowrap">
            <span>
              REZERVUOK
              <br />
              LAIKĄ MARSE
            </span>
            <ArrowUpRightIcon aria-hidden weight="light" className="size-hero-sticker-arrow" />
          </span>
        </Link>
      </div>

      <div className={`absolute inset-x-gutter bottom-6 z-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 pt-3 text-micro md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:pt-1 ${ENTER} motion-safe:delay-700`}>
        <address className="col-start-1 row-start-1 not-italic md:whitespace-nowrap">{PARK_ADDRESS.compact}</address>
        <a href={telHref(HERO_PHONE)} className="col-start-1 row-start-2 inline-flex min-h-11 items-center justify-self-start whitespace-nowrap hover:underline md:col-start-2 md:row-start-1 md:justify-self-center">
          {HERO_PHONE}
        </a>
        <Link href="#kryptys" className="col-start-2 row-span-2 row-start-1 inline-flex min-h-11 items-center justify-self-end gap-1 whitespace-nowrap hover:underline md:col-start-3 md:row-span-1">
          Leiskis žemyn
          <ArrowDownIcon aria-hidden className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}
