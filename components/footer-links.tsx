import Link from "next/link";
import { CookieSettingsLink } from "@/components/consent/cookie-settings-link";
import type { ServiceId } from "@/components/landing/content";
import { SERVICE_PAGES } from "@/components/services/service-content";

const LINK = "inline-flex min-h-11 items-center text-xs lg:min-h-6 transition-colors duration-150 ease-out-strong hover:text-rust";

const FOOTER_LABELS: Partial<Record<string, string>> = {
  pirtis: "Pirtis",
  nakvyne: "Nakvynė",
  restoranas: "Restoranas",
  sventes: "Šventės",
};
const SERVICE_LINKS = Object.entries(SERVICE_PAGES).map(([slug, { label, service }]) => ({
  href: `/${slug}`,
  label: FOOTER_LABELS[slug] ?? label,
  service,
}));
const SERVICE_GROUPS: readonly { title: string; services: readonly ServiceId[] }[] = [
  { title: "Pramogos", services: ["sauna", "ciongo", "wake"] },
  { title: "Poilsis ir maistas", services: ["cabins", "food"] },
  { title: "Šventės ir renginiai", services: ["party"] },
];
const LINK_GROUPS = [
  ...SERVICE_GROUPS.map(({ title, services }) => ({ title, links: SERVICE_LINKS.filter(({ service }) => services.includes(service)) })),
  { title: "Informacija", links: [
    { href: "/kainos", label: "Kainos" },
    { href: "/kontaktai", label: "Kontaktai" },
    { href: "/privatumo-politika", label: "Privatumo politika" },
  ] },
];

/** Service and information links grouped by what the visitor is looking for. */
export function FooterLinks() {
  return (
    <nav aria-label="Veiklos ir informacija" className="mt-10 mb-6 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-line pt-6 lg:grid-cols-4">
      {LINK_GROUPS.map(({ title, links }) => (
        <div key={title}>
          <p className="mb-1 text-xs font-bold">{title}</p>
          <ul>
            {links.map(({ href, label }) => (
              <li key={href}><Link href={href} className={LINK}>{label}</Link></li>
            ))}
            {title === "Informacija" ? <li><CookieSettingsLink className={LINK} /></li> : null}
          </ul>
        </div>
      ))}
    </nav>
  );
}
