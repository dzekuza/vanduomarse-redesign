import Link from "next/link";
import { SERVICE_PAGES } from "@/components/services/service-content";

const LINK = "inline-flex min-h-11 items-center text-xs transition-colors duration-150 ease-out-strong hover:text-rust";

const SERVICE_LINKS = Object.entries(SERVICE_PAGES).map(([slug, { label }]) => ({ href: `/${slug}`, label }));
const INFO_LINKS = [
  { href: "/kontaktai", label: "Kontaktai" },
  { href: "/privatumo-politika", label: "Privatumo politika" },
];

/** Crawlable link row to every service page plus contacts and privacy, shown above the footer bar. */
export function FooterLinks() {
  return (
    <nav aria-label="Veiklos ir informacija" className="mb-6 grid grid-cols-2 gap-x-6 border-t border-line pt-4 sm:grid-cols-3 lg:grid-cols-4">
      {[...SERVICE_LINKS, ...INFO_LINKS].map(({ href, label }) => (
        <Link key={href} href={href} className={LINK}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
