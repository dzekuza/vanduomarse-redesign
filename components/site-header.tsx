import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between px-6 py-5 md:px-10">
      <Link href="/" className="font-display text-2xl font-extrabold tracking-tight">
        VANDUO MARSE
      </Link>
      <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
        <a href="#zonos" className="hover:text-rust">
          Zonos
        </a>
        <a href="#kainos" className="hover:text-rust">
          Kainos
        </a>
        <Link href="/pirtis" className="hover:text-rust">
          Pirtis Marse
        </Link>
      </nav>
      <Link
        href="/pirtis"
        className="rounded-none border border-ink bg-ink px-4 py-2 text-sm font-medium text-foam transition-colors hover:bg-rust hover:border-rust"
      >
        Rezervuoti pirtį
      </Link>
    </header>
  );
}
