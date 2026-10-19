import Link from "next/link";
import { BrandLogo } from "./brand-logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-dust px-6 py-4 md:px-10">
      <BrandLogo className="h-14 w-auto md:h-16" priority />
      <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
        <Link href="/#zonos" className="hover:text-rust">
          Zonos
        </Link>
        <Link href="/#kainos" className="hover:text-rust">
          Kainos
        </Link>
        <Link href="/pirtis" className="hover:text-rust">
          Pirtis Marse
        </Link>
        <Link href="/renginiai" className="hover:text-rust">
          Renginiai
        </Link>
      </nav>
      <Link
        href="/pirtis"
        className="rounded-none border border-ink bg-ink px-4 py-2 text-sm font-medium text-foam transition-[color,background-color,border-color,transform] active:scale-[0.97] hover:bg-rust hover:border-rust"
      >
        Rezervuoti pirtį
      </Link>
    </header>
  );
}
