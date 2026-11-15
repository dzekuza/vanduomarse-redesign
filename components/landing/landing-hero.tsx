import { ArrowDownIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { StarMark } from "@/components/star-mark";
import { MAIN_CONTACT, MAPS_URL, telHref } from "@/lib/contacts";
import { PARK_ADDRESS } from "./content";
import { HeroOrbits } from "./hero-orbits";
import { HeroBookingLink } from "./hero-booking-link";

/** Load sequence: each block fades up in turn (see delays); skipped under reduced motion. */
const ENTER = "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700 motion-safe:ease-out-strong motion-safe:fill-mode-both";
const ACTIVITIES_LINK = "group/cta min-h-11 items-center gap-2 border-b border-current py-2.5 text-xs font-bold tracking-normal transition-opacity duration-150 active:opacity-70";

/** Dark hero: grid, cut photo, the "Užsuk į Marsą" headline and the planner sticker. */
export function LandingHero() {
  const activitiesArrow = <ArrowDownIcon aria-hidden className="size-6 transition-transform motion-safe:group-hover/cta:translate-y-1" />;

  return (
    <section
      id="pradzia"
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-ink pt-28 text-dust md:h-svh md:px-gutter md:pt-0 md:max-h-235 md:min-h-215 lg:h-auto lg:min-h-0 lg:max-h-none lg:flex-1"
    >
      <div aria-hidden className="absolute inset-0 bg-grid-hero opacity-10" />

      <HeroOrbits />

      <p className={`relative z-3 mx-gutter text-micro md:absolute md:left-gutter md:mx-0 md:top-37.5 md:text-xs lg:top-hero-kicker ${ENTER} motion-safe:delay-100`}>
        ŽEMĖ TA PATI. JAUSMAS KITAS.
      </p>

      <h1 id="hero-title" className={`relative left-gutter z-3 mt-7 -ml-1.5 w-fit whitespace-nowrap text-hero-sm md:absolute md:mt-0 md:top-53 md:text-hero lg:top-hero-title ${ENTER} motion-safe:slide-in-from-bottom-8 motion-safe:delay-150 motion-safe:duration-800`}>
        UŽSUK
        <br />
        <span className="text-rust">Į MARSĄ.</span>
        <StarMark className="absolute motion-safe:animate-spin-slow -top-2 right-4 size-8 text-rust md:top-1.5 md:-right-24 md:size-19" />
      </h1>

      <div className="relative mt-7 flex min-h-94 flex-col justify-end md:contents">
        <div className="absolute inset-0 md:inset-auto md:right-0 w-full overflow-hidden bg-lake-soft clip-hero-narrow md:top-35 md:bottom-24 md:w-3/4 md:clip-hero-wide lg:w-2/3">
          <Image src="/landing/wake.webp" alt="Vandenlentininkas šuolyje virš Marso vandens" fill loading="eager" fetchPriority="high" sizes="(min-width: 1024px) 67vw, 100vw" className="object-cover object-center saturate-80 motion-safe:animate-in motion-safe:zoom-in-105 motion-safe:duration-1000 motion-safe:ease-out-strong" />
          <div aria-hidden className="absolute inset-0 bg-linear-to-t from-ink/85 to-transparent to-70% md:bg-linear-to-r md:from-ink/80 md:via-ink/10 md:to-transparent" />
        </div>

        <div className={`relative z-4 px-gutter pb-3 md:absolute md:inset-x-gutter md:bottom-39 md:p-0 lg:bottom-hero-actions ${ENTER} motion-safe:slide-in-from-bottom-4 motion-safe:delay-350`}>
          <p className="text-xs leading-loose md:max-w-105 md:text-sm">
            Laisvalaikio ir pramogų parkas vos 20 min. nuo Kauno centro. Švenčių erdvės, pirtys, keturračiai, maistas ir nakvynė.
          </p>
          <Link href="#kryptys" className={`${ACTIVITIES_LINK} mt-4 inline-flex md:hidden`}>
            Ką gali rezervuoti?
            {activitiesArrow}
          </Link>
        </div>

        <HeroBookingLink />
      </div>

      <div className={`relative z-4 mx-gutter grid items-center gap-x-4 pt-14 pb-8 text-micro md:absolute md:inset-x-gutter md:bottom-6 md:mx-0 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:pt-1 md:pb-0 ${ENTER} motion-safe:delay-700`}>
        <address className="col-start-1 row-start-1 not-italic md:whitespace-nowrap">
          <a href={MAPS_URL} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center hover:underline">
            {PARK_ADDRESS.compact}
          </a>
        </address>
        <a href={telHref(MAIN_CONTACT.phone)} className="col-start-1 row-start-2 inline-flex min-h-11 items-center justify-self-start whitespace-nowrap hover:underline md:col-start-2 md:row-start-1 md:justify-self-center">
          {MAIN_CONTACT.phone}
        </a>
        <Link href="#kryptys" className={`${ACTIVITIES_LINK} col-start-3 row-start-1 hidden justify-self-end whitespace-nowrap md:inline-flex`}>
          Ką gali rezervuoti?
          {activitiesArrow}
        </Link>
      </div>
    </section>
  );
}
