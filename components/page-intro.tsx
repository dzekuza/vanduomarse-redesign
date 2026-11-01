import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface IntroFact {
  label: string;
  value: string;
}

/** Load sequence, same recipe as the home hero; skipped under reduced motion. */
const ENTER = "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700 motion-safe:ease-out-strong motion-safe:fill-mode-both";

interface PageIntroProps {
  eyebrow: string;
  /** Two lines; the second is coral. */
  title: [string, string];
  intro: string;
  facts?: IntroFact[];
  children?: ReactNode;
  className?: string;
}

/**
 * Dark intro band of every inner page, continuing the header: status-dot
 * eyebrow, big uppercase title, intro copy and an optional facts row, over the
 * hero's grid and orbit lines.
 */
export function PageIntro({ eyebrow, title, intro, facts, children, className }: PageIntroProps) {
  return (
    <section aria-labelledby="page-title" className={cn("relative overflow-hidden bg-ink px-gutter pt-4 pb-12 text-dust md:pt-8 md:pb-16", className)}>
      <div aria-hidden className="absolute inset-0 bg-grid-hero opacity-10" />
      <div aria-hidden className="pointer-events-none absolute rounded-full border border-dust/20 orbit-round" />
      <div className="relative">
        <p className={cn("flex items-center gap-2.5 text-micro uppercase", ENTER, "motion-safe:delay-100")}>
          <span aria-hidden className="size-1.5 rounded-full bg-water ring-5 ring-water/15" />
          {eyebrow}
        </p>
        <h1 id="page-title" className={cn("mt-6 text-display font-bold uppercase", ENTER, "motion-safe:slide-in-from-bottom-8 motion-safe:delay-150 motion-safe:duration-800")}>
          {title[0]}
          <br />
          <span className="text-rust">{title[1]}</span>
        </h1>
        <p className={cn("mt-6 max-w-md text-xs leading-loose md:text-sm", ENTER, "motion-safe:slide-in-from-bottom-4 motion-safe:delay-300")}>{intro}</p>
        {facts?.length ? (
          <dl className={cn("mt-10 grid grid-cols-2 border-t border-dust/30 md:grid-cols-4", ENTER, "motion-safe:delay-500")}>
            {facts.map((f) => (
              <div key={f.label} className="border-b border-dust/20 py-4 pr-4 md:border-b-0">
                <dt className="text-micro uppercase text-dust/70">{f.label}</dt>
                <dd className="mt-1 text-sm">{f.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {children ? <div className={cn("mt-8", ENTER, "motion-safe:delay-500")}>{children}</div> : null}
      </div>
    </section>
  );
}
