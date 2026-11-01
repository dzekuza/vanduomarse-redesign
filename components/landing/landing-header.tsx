"use client";

import { MenuPanel } from "@/components/menu-panel";
import { SiteHeader } from "@/components/site-header";
import { BOOKING_LINKS, LANDING_NAV } from "./content";
import { Cta } from "@/components/cta";

const ITEMS = LANDING_NAV.map((l) => ({ href: l.href, label: l.panel }));

/** Transparent header over the hero: on-page links, planner CTA and the full-screen menu. */
export function LandingHeader() {
  return (
    <SiteHeader
      placement="overlay"
      logoHref="#pradzia"
      nav={LANDING_NAV.slice(0, 3)}
      cta={
        <Cta tone="coral" small href="#kryptys" className="px-3 text-xs max-sm:[&>svg]:hidden md:px-4.5">
          Rezervuok
        </Cta>
      }
      menu={(close) => <MenuPanel items={ITEMS} secondary={BOOKING_LINKS} secondaryTitle="Rezervuoti ir užsakyti" onNavigate={close} />}
    />
  );
}
