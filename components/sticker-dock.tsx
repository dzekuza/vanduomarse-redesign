"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Zone stickers from the brand kit; Akademija and Skoniai have no page yet, so they jump to their home card. */
const STICKERS = [
  { href: "/", label: "Vanduo Marse", src: "/brand/sticker-vanduo.svg", width: 85, height: 110 },
  { href: "/#akademija", label: "Marso Akademija", src: "/brand/sticker-akademija.svg", width: 101, height: 111 },
  { href: "/#skoniai", label: "Skoniai Marse", src: "/brand/sticker-skoniai.svg", width: 86, height: 110 },
  { href: "/miegas", label: "Miegas Marse", src: "/brand/sticker-miegas.svg", width: 86, height: 111 },
] as const;

/** Routes with their own fixed bottom bar on phones: the dock steps aside below `lg`. */
const OWN_BOTTOM_BAR = ["/skaiciuokle"];

/** Zone stickers on the public site (not in /admin or the /embed widgets): full-width bar on phones, a floating hug-width dock from `lg`. */
export function StickerDock() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/embed")) return null;
  const visibility = OWN_BOTTOM_BAR.includes(pathname) ? "hidden lg:block" : "block";

  return (
    <div className={visibility}>
      {/* Reserves the dock's height so the footer is never covered. */}
      <div aria-hidden className="box-content h-21 pb-[env(safe-area-inset-bottom)] lg:h-28" />
      <nav
        aria-label="Marso zonos"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-foam/60 bg-foam/50 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 lg:inset-x-auto lg:bottom-6 lg:left-1/2 lg:-translate-x-1/2 lg:border lg:pb-0 lg:shadow-lg"
      >
        <ul className="mx-auto flex max-w-md items-end justify-around px-4 pb-2 pt-2 lg:gap-6 lg:px-6">
          {STICKERS.map((s) => {
            const active = s.href === pathname;
            return (
              <li key={s.href}>
                <Link
                  href={s.href}
                  aria-label={s.label}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 items-end transition-transform duration-200 hover:-translate-y-1 hover:-rotate-3 active:scale-95 ${
                    active ? "-translate-y-1" : ""
                  }`}
                >
                  <Image src={s.src} alt="" width={s.width} height={s.height} className="h-16 w-auto" />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
