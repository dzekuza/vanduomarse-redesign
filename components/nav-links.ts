/** Primary navigation of the inner pages: the menu panel lists all of it, the desktop header the booking pages. */
export const NAV_LINKS = [
  { href: "/pirtis", label: "Pirtis Marse" },
  { href: "/miegas", label: "Miegas Marse" },
  { href: "/keturraciai", label: "Keturračiai" },
  { href: "/renginiai", label: "Renginiai" },
  { href: "/skaiciuokle", label: "Skaičiuoklė" },
  { href: "/kuponai", label: "Dovanų kuponai" },
] as const;

/** Desktop header links (the coupons page has its own button there). */
export const PAGE_NAV = NAV_LINKS.filter((l) => l.href !== "/kuponai");
