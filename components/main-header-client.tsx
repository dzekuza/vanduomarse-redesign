"use client";

import { UserIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { Cta } from "@/components/cta";
import { MenuPanel } from "@/components/menu-panel";
import { ACCOUNT_LINK, SECTION_LINKS, type NavLink } from "@/components/nav-links";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

/** Client half of `MainHeader`: gets the nav already stripped of hidden service pages. */
export function MainHeaderClient({ placement, nav }: { placement: "overlay" | "bar"; nav: readonly NavLink[] }) {
  return (
    <SiteHeader
      placement={placement}
      logoHref="/"
      nav={nav}
      cta={(menuOpen) => (
        <>
          <Link
            href={ACCOUNT_LINK.href}
            aria-label={ACCOUNT_LINK.label}
            title={ACCOUNT_LINK.label}
            className={cn("hidden size-11 place-content-center border md:grid transition-[color,scale] duration-150 ease-out-strong motion-safe:active:scale-95", menuOpen ? "border-ink/30" : "border-line-on-ink hover:text-rust")}
          >
            <UserIcon aria-hidden size={20} />
          </Link>
          <Cta tone={menuOpen ? "cream" : "coral"} small href="/rezervacija" className={cn("px-3 text-xs md:px-5", menuOpen && "bg-foam hover:bg-dust")}>
            Rezervuok
          </Cta>
        </>
      )}
      menu={(close) => <MenuPanel items={[...nav, ACCOUNT_LINK]} secondary={SECTION_LINKS} secondaryTitle="Pagrindinis puslapis" onNavigate={close} />}
    />
  );
}
