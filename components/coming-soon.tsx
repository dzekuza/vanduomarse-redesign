import Image from "next/image";
import { GateCodeForm } from "@/components/gate-code-form";
import { Wordmark } from "@/components/wordmark";
import { MAIN_CONTACT, telHref } from "@/lib/contacts";
import { INSTAGRAM_URL } from "@/components/landing/content";

const COPY = {
  eyebrow: "Svetainė atnaujinama",
  title: ["Netrukus", "atsidarom."],
  intro:
    "Kuriame naują Vanduo Marse svetainę. Kol ją baigiame, rezervacijų ir klausimų laukiame telefonu, el. paštu ar Instagram.",
  instagram: "Instagram",
} as const;

/** Load sequence, same recipe as `PageIntro`; skipped under reduced motion. */
const ENTER = "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700 motion-safe:ease-out-strong motion-safe:fill-mode-both";
const LINK = "inline-flex min-h-11 items-center border-t border-line-on-ink text-sm transition-colors duration-150 ease-out-strong hover:text-rust";

function ContactLink({ href, external, children }: { href: string; external?: boolean; children: string }) {
  return (
    <a href={href} className={LINK} {...(external ? { target: "_blank", rel: "noopener" } : {})}>
      {children}
    </a>
  );
}

/** Full-screen "coming soon" page shown by the site gate (`lib/site-gate.ts`). `withCode` adds the preview code field. */
export function ComingSoon({ withCode }: { withCode: boolean }) {
  return (
    <main className="relative flex min-h-dvh flex-col justify-between gap-12 overflow-hidden bg-ink px-gutter pt-8 pb-6 text-dust">
      <div aria-hidden className="absolute inset-0 bg-grid-hero opacity-10" />
      <div aria-hidden className="pointer-events-none absolute rounded-full border border-line-on-ink orbit-round" />

      <Image src="/brand/logo-light.svg" alt="Vanduo Marse" width={134} height={51} loading="eager" fetchPriority="high" className="relative h-auto w-26 md:w-30" />

      <section aria-labelledby="gate-title" className="relative">
        <p className={`flex items-center gap-2.5 text-micro uppercase ${ENTER} motion-safe:delay-100`}>
          <span aria-hidden className="size-1.5 rounded-full bg-water ring-5 ring-water/15" />
          {COPY.eyebrow}
        </p>
        <h1 id="gate-title" className={`mt-6 text-display font-bold uppercase ${ENTER} motion-safe:slide-in-from-bottom-8 motion-safe:delay-150`}>
          {COPY.title[0]}
          <br />
          <span className="text-rust">{COPY.title[1]}</span>
        </h1>
        <p className={`mt-6 max-w-md text-xs leading-loose md:text-sm ${ENTER} motion-safe:delay-300`}>{COPY.intro}</p>
        <nav aria-label="Kontaktai" className={`mt-10 grid max-w-md ${ENTER} motion-safe:delay-500`}>
          <ContactLink href={telHref(MAIN_CONTACT.phone)}>{MAIN_CONTACT.phone}</ContactLink>
          <ContactLink href={`mailto:${MAIN_CONTACT.email}`}>{MAIN_CONTACT.email}</ContactLink>
          <ContactLink href={INSTAGRAM_URL} external>
            {COPY.instagram}
          </ContactLink>
        </nav>
        {withCode ? <div className={`mt-10 ${ENTER} motion-safe:delay-700`}><GateCodeForm /></div> : null}
      </section>

      <Wordmark aria-hidden className="relative" />
    </main>
  );
}
