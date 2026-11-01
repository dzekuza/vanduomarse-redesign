import { StarMark } from "@/components/star-mark";

const PHRASES = ["PO DARBO — Į MARSĄ.", "SAVI ŽMONĖS. KITAS TEMPAS."];

/** Coral marquee strip. Two identical halves, so the -50% loop is seamless. */
export function LandingTicker() {
  return (
    <div aria-hidden className="overflow-hidden border-y border-ink bg-rust py-3.5 text-sm font-bold whitespace-nowrap text-ink md:py-5 md:text-xl">
      <div className="flex w-max motion-safe:animate-marquee">
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0 items-center">
            {[...PHRASES, ...PHRASES].map((phrase, i) => (
              <span key={i} className="flex items-center">
                {phrase}
                <StarMark className="mx-5 size-5 md:mx-10 md:size-7" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
