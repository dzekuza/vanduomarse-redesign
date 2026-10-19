import Link from "next/link";
import { ArrowLink } from "./arrow-link";
import { TrackPanel } from "./track-panel";

/** Load-in for hero blocks: fade up, staggered with `delay-*`; skipped under reduced motion. */
const REVEAL = "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:fill-mode-both";

export function Hero() {
  return (
    <section className="grid gap-12 px-6 pb-16 pt-10 md:px-10 md:pb-24 md:pt-16 lg:grid-cols-12 lg:items-end lg:gap-10">
      <div className="lg:col-span-7 lg:pb-2">
        <p className={`flex items-center gap-3 text-xs uppercase text-ink/70 ${REVEAL}`}>
          <span aria-hidden className="h-px w-8 shrink-0 bg-rust" />
          <span>
            Kabelinis vandenlenčių parkas <span className="whitespace-nowrap">· Lietuva</span>
          </span>
        </p>
        <h1 className={`mt-6 font-display text-5xl font-bold leading-none sm:text-6xl xl:text-7xl ${REVEAL} delay-100`}>
          Žemė per
          <br />
          toli. Plauk
          <br />
          Marse.
        </h1>
        <p className={`mt-6 max-w-md md:mt-8 text-base leading-relaxed text-ink/80 md:text-lg ${REVEAL} delay-200`}>
          Kabelio trasa per visą ežerą. Vienu metu plaukia iki 8 raitelių,
          pirmąkart ar jau treniruotas.
        </p>
        <div className={`mt-8 flex flex-wrap md:mt-10 items-center gap-x-8 gap-y-4 ${REVEAL} delay-300`}>
          <ArrowLink href="#kainos">Žiūrėti kainas</ArrowLink>
          <Link
            href="#zonos"
            className="inline-flex min-h-11 items-center text-sm uppercase underline decoration-ink/40 underline-offset-8 transition-colors hover:text-rust hover:decoration-rust"
          >
            Visos zonos
          </Link>
        </div>
      </div>
      <TrackPanel className={`lg:col-span-5 ${REVEAL} delay-500`} />
    </section>
  );
}
