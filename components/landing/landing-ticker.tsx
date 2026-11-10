import { StarMark } from "@/components/star-mark";

const PHRASES = [
  "VOS 20 MINUČIŲ NUO KAUNO CENTRO",
  "ŠVENTĖS IR ĮMONIŲ RENGINIAI",
  "IŠVYKOS KETURRAČIAIS IR PRIVATI PIRTIS",
  "MAISTAS IR NAKVYNĖ VIENOJE VIETOJE",
];

/** Coral marquee strip. Two identical halves, so the -50% loop is seamless. */
export function LandingTicker() {
  return (
    <div aria-hidden className="shrink-0 overflow-hidden border-t border-ink bg-rust py-3 text-sm font-bold whitespace-nowrap text-on-rust md:py-5 md:text-figure">
      <div className="ticker-track motion-safe:animate-marquee">
        {[0, 1].map((half) => (
          <div key={half} className="flex items-center justify-between">
            {PHRASES.map((phrase, i) => (
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
