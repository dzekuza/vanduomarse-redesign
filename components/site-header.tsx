import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { MobileMenu } from "./mobile-menu";
import { NAV_LINKS } from "./nav-links";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-line bg-dust px-6 py-3 md:px-10 md:py-4">
      <BrandLogo className="h-12 w-auto md:h-16" priority />
      <nav className="hidden items-center gap-1 text-sm font-medium lg:flex">
        {NAV_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="px-2.5 py-3 hover:text-rust">
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <Link
          href="/pirtis"
          className="flex min-h-11 items-center border border-ink bg-ink px-4 text-sm font-medium text-foam transition-[color,background-color,border-color,transform] hover:border-rust hover:bg-rust active:scale-[0.97]"
        >
          Rezervuoti pirtį
        </Link>
        <MobileMenu />
      </div>
    </header>
  );
}
