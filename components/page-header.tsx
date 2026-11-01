"use client";

import { Cta } from "@/components/cta";
import { MenuPanel } from "@/components/menu-panel";
import { NAV_LINKS, PAGE_NAV } from "@/components/nav-links";
import { SiteHeader } from "@/components/site-header";

const SECONDARY = [
  { href: "/", label: "Pradžia" },
  { href: "/#kryptys", label: "Ką veikiam?" },
  { href: "/#vieta", label: "Kur nusileisti?" },
  { href: "/#klausimai", label: "Klausimai" },
] as const;

/** Header for every inner page (booking, events, coupons, calculator). */
export function PageHeader() {
  return (
    <SiteHeader
      placement="bar"
      logoHref="/"
      nav={PAGE_NAV}
      cta={
        <Cta tone="coral" small href="/kuponai" className="px-3 text-xs max-sm:[&>svg]:hidden md:px-4.5">
          <span>
            <span className="max-sm:hidden">Dovanų&nbsp;</span>kuponai
          </span>
        </Cta>
      }
      menu={(close) => <MenuPanel items={NAV_LINKS} secondary={SECONDARY} secondaryTitle="Marso pradžia" onNavigate={close} />}
    />
  );
}
