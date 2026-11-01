import { ArrowDownIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { PARK_ADDRESS } from "./content";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import { StarMark } from "@/components/star-mark";

/** Load sequence: each block fades up in turn (see delays); skipped under reduced motion. */
const ENTER = "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700 motion-safe:ease-out-strong motion-safe:fill-mode-both";

/** Dark hero: cut photo, orbit lines, the "Išsuk į Marsą" headline and the planner sticker. */
export function LandingHero() {
  return (
    <section
      id="pradzia"
      aria-labelledby="hero-title"
      className="relative h-212 overflow-hidden bg-ink px-gutter text-dust md:h-svh md:max-h-235 md:min-h-215 min-[1700px]:max-h-250 min-[1700px]:h-250"
    >
      <div aria-hidden className="absolute inset-0 bg-grid-hero opacity-10" />
      <div aria-hidden className="pointer-events-none absolute z-2 rounded-full border border-dust/20 orbit-wide" />
      <div aria-hidden className="pointer-events-none absolute z-2 rounded-full border border-dust/20 orbit-round" />

      <div className="absolute top-82 right-0 bottom-32 w-full overflow-hidden bg-lake-soft clip-hero-narrow md:top-35 md:bottom-24 md:w-3/4 md:clip-hero-wide lg:w-2/3">
        <Image src="/landing/wake.webp" alt="Vandenlentininkas šuolyje virš Marso vandens" fill priority sizes="(min-width: 1024px) 67vw, 100vw" className="object-cover object-center saturate-80 motion-safe:animate-in motion-safe:zoom-in-105 motion-safe:duration-1000 motion-safe:ease-out-strong" />
        <div aria-hidden className="absolute inset-0 bg-linear-to-t from-ink/85 to-transparent to-70% md:bg-linear-to-r md:from-ink/80 md:via-ink/10 md:to-transparent" />
      </div>

      <p className={`absolute top-30 left-gutter z-3 flex items-center gap-2.5 text-micro md:top-37.5 md:text-xs ${ENTER} motion-safe:delay-100`}>
        <span aria-hidden className="size-1.5 rounded-full bg-water ring-5 ring-water/15" />
        ŽEMĖ TA PATI. JAUSMAS — KITAS.
      </p>

      <h1 id="hero-title" className={`absolute top-42 left-gutter z-3 -ml-1.5 text-hero-sm md:top-53 md:text-hero ${ENTER} motion-safe:slide-in-from-bottom-8 motion-safe:delay-150 motion-safe:duration-800`}>
        IŠSUK
        <br />
        <span className="text-rust">Į MARSĄ.</span>
        <StarMark className="absolute motion-safe:animate-spin-slow -top-2 right-2.5 size-8 text-rust md:top-1.5 md:-right-24 md:size-19" />
      </h1>

      <div className={`absolute inset-x-gutter bottom-39 z-4 md:flex md:items-end md:justify-between ${ENTER} motion-safe:slide-in-from-bottom-4 motion-safe:delay-350`}>
        <p className="max-w-105 text-xs leading-loose md:text-sm">
          Vanduo. Garas. Greitis.
          <br />
          Ir žmonės, su kuriais norisi pasilikti.
        </p>
        <Link href="#kryptys" className="group/cta mt-4 inline-flex min-h-11 transition-opacity duration-150 active:opacity-70 items-center gap-6 border-b border-current py-2.5 text-xs font-bold md:mr-5 md:mt-0">
          Rask savo planą
          <ArrowDownIcon aria-hidden className="size-6 transition-transform motion-safe:group-hover/cta:translate-y-1" />
        </Link>
      </div>

      <Link
        href="#kryptys"
        aria-label="Rezervuoti dieną Marse"
        className="absolute top-90 left-7 z-5 grid size-25 rotate-12 place-content-center justify-items-center gap-0.5 rounded-full border border-ink bg-rust text-center text-micro font-bold text-ink ring-7 ring-rust transition-transform duration-200 ease-out-strong motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-90 motion-safe:duration-700 motion-safe:delay-500 motion-safe:fill-mode-both motion-safe:hover:rotate-0 motion-safe:active:scale-95 md:top-45 md:right-gutter md:left-auto md:size-32 lg:size-41"
      >
        <span>
          MAŽIAU PLANŲ.
          <br />
          DAUGIAU MARSO.
        </span>
        <ArrowUpRightIcon aria-hidden weight="light" className="size-8 md:size-12" />
      </Link>

      <div className={`absolute inset-x-gutter bottom-6 z-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-dust/30 pt-4 text-micro tracking-widest md:text-xs md:gap-x-10 md:pt-5 ${ENTER} motion-safe:delay-700`}>
        <span>KAUNO RAJONAS</span>
        <span>{PARK_ADDRESS.street.toUpperCase()}</span>
        <span className="ml-auto max-sm:hidden">LEISKIS ŽEMYN ↓</span>
      </div>
    </section>
  );
}
