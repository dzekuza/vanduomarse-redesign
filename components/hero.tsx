import Link from "next/link";
import { ArrowLink } from "./arrow-link";
import { Wordmark } from "./wordmark";

/** Load-in for hero blocks: fade up, staggered with `delay-*`; skipped under reduced motion. */
const REVEAL = "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:fill-mode-both";

export function Hero() {
  return (
    <section className="px-6 pb-10 pt-4 md:px-10 md:pb-14 md:pt-8">
      <Wordmark as="h1" className={REVEAL} />
      <div className={`mt-6 grid gap-3 text-xs uppercase md:mt-10 md:grid-cols-3 md:items-start md:gap-6 ${REVEAL} delay-200`}>
        <p className="text-balance leading-relaxed">Kabelinis vandenlenčių parkas, pirtis ir nakvynė prie ežero</p>
        <p className="leading-relaxed md:text-center">Ežero krantas, Lietuva</p>
        <p className="text-balance leading-relaxed md:text-right">Plaukimas be išankstinės rezervacijos</p>
      </div>
      <div className={`mt-8 flex flex-wrap items-center gap-3 ${REVEAL} delay-300`}>
        <ArrowLink href="#kainos" pill>
          Žiūrėti kainas
        </ArrowLink>
        <Link
          href="#zonos"
          className="inline-flex min-h-12 items-center rounded-full border border-ink px-6 text-sm uppercase transition-colors hover:border-rust hover:text-rust"
        >
          Visos zonos
        </Link>
      </div>
    </section>
  );
}
