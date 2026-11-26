import { RESERVATION_TYPES, RESERVATION_TYPE_LABEL, serviceHref } from "@/lib/reservation-links";
import { WAKE_BLACK_FRIDAY_PATH } from "@/lib/wake-black-friday";

export interface NavLink {
  href: string;
  label: string;
  /** Shown as a dropdown under the desktop link and as small links under the big one in the menu panel. */
  children?: readonly { href: string; label: string }[];
}

/** Primary navigation of the public site: the desktop header and the big links of the menu panel. */
export const NAV_LINKS: readonly NavLink[] = [
  {
    href: "/#kryptys",
    label: "Pramogos ir poilsis",
    // Sessions and private hire share /pirtis, so they are one entry.
    children: RESERVATION_TYPES.filter((type) => type !== "private").map((type) => ({
      href: serviceHref(type),
      label: type === "session" ? "Pirtis" : RESERVATION_TYPE_LABEL[type],
    })).concat([
      { href: "/sventes", label: "Šventės" },
      { href: "/restoranas", label: "Skoniai" },
    ]),
  },
  { href: "/renginiai", label: "Renginiai" },
  { href: "/skaiciuokle", label: "Kainų skaičiuoklė" },
  { href: "/kuponai", label: "Dovanų kuponai" },
  // Campaign link, kept rightmost: remove it when the Black Friday offer ends.
  { href: WAKE_BLACK_FRIDAY_PATH, label: "Black Friday" },
];

/** Customer account: an icon button beside the "Rezervuok" CTA instead of a text link. */
export const ACCOUNT_LINK = { href: "/paskyra", label: "Mano rezervacijos" } as const;

/** Sections of the home page, listed under the big links of the menu panel. */
export const SECTION_LINKS = [
  { href: "/", label: "Pradžia" },
  { href: "/#kryptys", label: "Pramogos ir poilsis" },
  { href: "/#sventes", label: "Šventės ir renginiai" },
  { href: "/#vieta", label: "Kaip atvykti" },
  { href: "/#klausimai", label: "Klausimai" },
] as const;
