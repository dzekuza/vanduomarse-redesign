"use client";

import { Cta } from "@/components/cta";
import { MenuPanel } from "@/components/menu-panel";
import { NAV_LINKS, SECTION_LINKS } from "@/components/nav-links";
import { SiteHeader } from "@/components/site-header";

/** The one header of the public site: same logo, links, CTA and menu on the home page (floating over the hero) and every inner page (own ink bar). */
export function MainHeader({ placement = "bar" }: { placement?: "overlay" | "bar" }) {
  return (
    <SiteHeader
      placement={placement}
      logoHref="/"
      nav={NAV_LINKS}
      cta={
        <Cta tone="coral" small href="/rezervacija" className="px-3 text-xs md:px-5">
          Rezervuok
        </Cta>
      }
      menu={(close) => <MenuPanel items={NAV_LINKS} secondary={SECTION_LINKS} secondaryTitle="Marso pradžia" onNavigate={close} />}
    />
  );
}
