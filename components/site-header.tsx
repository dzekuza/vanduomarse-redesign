import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { ContactBar } from "./contact-bar";
import { MobileMenu } from "./mobile-menu";
import { NAV_LINKS } from "./nav-links";

export function SiteHeader() {
  return (
    <>
      <ContactBar />
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 bg-dust px-6 py-3 md:px-10 md:py-4">
        <BrandLogo className="h-11 w-auto md:h-12" priority />
        <nav className="hidden items-center gap-1 text-xs uppercase lg:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="inline-flex min-h-11 items-center px-2 hover:text-rust xl:px-3">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/pirtis"
            className="flex min-h-11 items-center rounded-full border border-ink bg-ink px-5 text-xs uppercase text-foam transition-[color,background-color,border-color,transform] hover:border-rust hover:bg-rust active:scale-[0.97]"
          >
            Rezervuoti pirtį
          </Link>
          <MobileMenu />
        </div>
      </header>
    </>
  );
}
