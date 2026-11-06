"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  nav: readonly { href: string; label: string }[];
  /** Call to action beside the menu button; a renderer can react to the open menu. */
  cta: ReactNode | ((menuOpen: boolean) => ReactNode);
  /** Content of the full-screen menu; `close` shuts it. */
  menu: (close: () => void) => ReactNode;
  /** `overlay` floats over a hero (home); `bar` also reserves its own ink strip in the page flow. */
  placement: "overlay" | "bar";
  logoHref: string;
}

/**
 * Ink header, fixed to the top on every page: logo, section links, CTA and the menu button.
 * Transparent over the hero, solid ink with a blur once the page scrolls.
 */
export function SiteHeader({ nav, cta, menu, placement, logoHref }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.classList.add("overflow-hidden");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("overflow-hidden");
    };
  }, [menuOpen]);

  const header = (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-20 flex h-21.5 items-center justify-between gap-3.5 border-b border-transparent px-gutter py-4 text-dust transition-[background-color,border-color] duration-200 md:h-26.5 md:gap-8 md:py-5",
        placement === "overlay" && "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 motion-safe:ease-out-strong",
        scrolled && !menuOpen && "border-line-on-ink bg-ink/95 backdrop-blur-md",
      )}
    >
      <Link href={logoHref} aria-label="Vanduo Marse, pradžia" className="w-29 shrink-0 md:w-35">
        <Image src="/brand/logo-light.svg" alt="Vanduo Marse" width={121} height={46} priority className="h-auto w-full" />
      </Link>
      <nav aria-label="Pagrindinis meniu" className="hidden items-center gap-5 text-xs lg:flex xl:gap-8">
        {nav.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="relative inline-flex min-h-11 items-center after:absolute after:inset-x-0 after:bottom-2 after:h-px after:origin-left after:scale-x-0 after:bg-dust motion-safe:after:transition-transform motion-safe:after:duration-200 motion-safe:after:ease-out-strong hover:after:scale-x-100"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2 md:gap-3">
        {typeof cta === "function" ? cta(menuOpen) : cta}
        <button
          type="button"
          aria-label={menuOpen ? "Uždaryti meniu" : "Atidaryti meniu"}
          aria-expanded={menuOpen}
          aria-controls="menu-panel"
          onClick={() => setMenuOpen((o) => !o)}
          className="grid size-11 place-content-center gap-1.75 border border-line-on-ink transition-[scale] duration-150 ease-out-strong motion-safe:active:scale-95 md:w-12"
        >
          <span className={cn("h-px w-5 bg-dust motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out-strong", menuOpen && "translate-y-1 rotate-45")} />
          <span className={cn("h-px w-5 bg-dust motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out-strong", menuOpen && "-translate-y-1 -rotate-45")} />
        </button>
      </div>
    </header>
  );

  return (
    <>
      {placement === "bar" ? <div className="relative h-21.5 bg-ink md:h-26.5">{header}</div> : header}
      {menuOpen ? menu(() => setMenuOpen(false)) : null}
    </>
  );
}
