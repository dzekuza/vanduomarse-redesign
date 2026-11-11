import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Cta } from "@/components/cta";
import { MAIN_CONTACT } from "@/lib/contacts";

export interface MenuLink {
  href: string;
  label: string;
}

const LINK_DELAY = ["motion-safe:delay-50", "motion-safe:delay-100", "motion-safe:delay-150", "motion-safe:delay-200"] as const;

interface MenuPanelProps {
  /** Big numbered links. */
  items: readonly MenuLink[];
  /** Smaller links under them, with their heading. */
  secondary: readonly MenuLink[];
  secondaryTitle: string;
  /** Account page, shown as a button right under the big links so it is visible without scrolling. */
  account?: MenuLink;
  onNavigate: () => void;
}

/** Full-screen coral menu: big numbered links, then a smaller list of the rest. */
export function MenuPanel({ items, secondary, secondaryTitle, account, onNavigate }: MenuPanelProps) {
  return (
    <div
      id="menu-panel"
      className="fixed inset-0 z-15 overflow-auto bg-rust px-gutter pt-29 pb-12 text-ink motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-250 motion-safe:ease-out-strong md:pt-36"
    >
      <nav aria-label="Mobilus meniu">
        {items.map((l, i) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            className={`flex items-center border-b border-ink/40 py-6 text-menu font-bold uppercase motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-400 motion-safe:ease-out-strong motion-safe:fill-mode-both md:py-5.5 ${LINK_DELAY[Math.min(i, 3)]}`}
          >
            <small className="mr-4 text-micro font-normal tracking-normal md:mr-8">{String(i + 1).padStart(2, "0")}</small>
            {l.label}
            <ArrowUpRightIcon aria-hidden className="ml-auto size-8 md:size-12" />
          </Link>
        ))}
      </nav>
      {account ? (
        <Cta tone="dark" small href={account.href} onClick={onNavigate} className="mt-6">
          {account.label}
        </Cta>
      ) : null}
      <nav aria-label={secondaryTitle} className="mt-8 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-400 motion-safe:delay-300 motion-safe:ease-out-strong motion-safe:fill-mode-both">
        <p className="text-micro uppercase">{secondaryTitle}</p>
        <ul className="mt-2 flex flex-wrap gap-x-6">
          {secondary.map((l) => (
            <li key={l.href}>
              <Link href={l.href} onClick={onNavigate} className="inline-flex min-h-11 items-center border-b border-transparent text-xs font-bold hover:border-ink">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <a href={`mailto:${MAIN_CONTACT.email}`} className="mt-6 inline-flex min-h-11 items-center text-xs">
        {MAIN_CONTACT.email}
      </a>
    </div>
  );
}
