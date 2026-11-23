"use client";

import { UserIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { Cta } from "@/components/cta";
import { MenuPanel } from "@/components/menu-panel";
import { ACCOUNT_LINK, NAV_LINKS, SECTION_LINKS } from "@/components/nav-links";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

/** The one header of the public site: same logo, links, CTA and menu on the home page (floating over the hero) and every inner page (own ink bar). */
export function MainHeader({ placement = "bar" }: { placement?: "overlay" | "bar" }) {
  return (
    <SiteHeader
      placement={placement}
      logoHref="/"
      nav={NAV_LINKS}
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
      menu={(close) => <MenuPanel items={[...NAV_LINKS, ACCOUNT_LINK]}secondary={SECTION_LINKS} secondaryTitle="Pagrindinis puslapis" onNavigate={close} />}
    />
  );
}
