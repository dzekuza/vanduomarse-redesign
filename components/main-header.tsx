import { MainHeaderClient } from "@/components/main-header-client";
import { NAV_LINKS } from "@/components/nav-links";
import { getHiddenServiceSlugs } from "@/lib/data/page-content";
import { withoutHiddenLinks } from "@/lib/hidden-pages";

/**
 * The one header of the public site: same logo, links, CTA and menu on the home page (floating over the hero) and every
 * inner page (own ink bar). Service pages the owner switched off are left out of the links and the menu.
 */
export async function MainHeader({ placement = "bar" }: { placement?: "overlay" | "bar" }) {
  const hidden = await getHiddenServiceSlugs();
  return <MainHeaderClient placement={placement} nav={withoutHiddenLinks(NAV_LINKS, hidden)} />;
}
