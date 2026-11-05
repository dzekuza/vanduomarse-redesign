/** Primary navigation of the public site: the desktop header and the big links of the menu panel. */
export const NAV_LINKS = [
  { href: "/rezervacija", label: "Rezervacija" },
  { href: "/renginiai", label: "Renginiai" },
  { href: "/skaiciuokle", label: "Skaičiuoklė" },
  { href: "/kuponai", label: "Dovanų kuponai" },
  { href: "/paskyra", label: "Mano rezervacijos" },
] as const;

/** Sections of the home page, listed under the big links of the menu panel. */
export const SECTION_LINKS = [
  { href: "/", label: "Pradžia" },
  { href: "/#kryptys", label: "Ką veikiam?" },
  { href: "/#sventes", label: "Šventės ir verslas" },
  { href: "/#vieta", label: "Kur nusileisti?" },
  { href: "/#klausimai", label: "Klausimai" },
] as const;
