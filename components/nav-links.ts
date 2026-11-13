import { RESERVATION_TYPES, RESERVATION_TYPE_LABEL, reservationHref } from "@/lib/reservation-links";

export interface NavLink {
  href: string;
  label: string;
  /** Shown as a dropdown under the desktop link and as small links under the big one in the menu panel. */
  children?: readonly { href: string; label: string }[];
}

/** Primary navigation of the public site: the desktop header and the big links of the menu panel. */
export const NAV_LINKS: readonly NavLink[] = [
  {
    href: "/rezervacija",
    label: "Rezervacija",
    children: RESERVATION_TYPES.map((type) => ({ href: reservationHref(type), label: RESERVATION_TYPE_LABEL[type] })),
  },
  { href: "/renginiai", label: "Renginiai" },
  { href: "/kuponai", label: "Dovanų kuponai" },
  { href: "/paskyra", label: "Mano rezervacijos" },
];

/** Sections of the home page, listed under the big links of the menu panel. */
export const SECTION_LINKS = [
  { href: "/", label: "Pradžia" },
  { href: "/#kryptys", label: "Pramogos ir poilsis" },
  { href: "/#sventes", label: "Šventės ir renginiai" },
  { href: "/#vieta", label: "Kaip atvykti" },
  { href: "/#klausimai", label: "Klausimai" },
] as const;
