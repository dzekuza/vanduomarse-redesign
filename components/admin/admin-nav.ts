import type { Icon } from "@phosphor-icons/react";
import { CalendarCheckIcon, CalendarDotsIcon, ChartPieSliceIcon, ConfettiIcon, EnvelopeSimpleIcon, FireIcon, TagIcon } from "@phosphor-icons/react";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: Icon;
  /** Store-driven count shown as a badge. */
  badge?: "pendingBookings" | "newInquiries";
  /** Shown directly in the mobile bottom bar; the rest live under "Daugiau". */
  primary?: boolean;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Apžvalga", icon: ChartPieSliceIcon, primary: true },
  { href: "/admin/rezervacijos", label: "Rezervacijos", icon: CalendarCheckIcon, badge: "pendingBookings", primary: true },
  { href: "/admin/uzimtumas", label: "Užimtumas", icon: CalendarDotsIcon, primary: true },
  { href: "/admin/uzklausos", label: "Užklausos", icon: EnvelopeSimpleIcon, badge: "newInquiries", primary: true },
  { href: "/admin/renginiai", label: "Renginiai", icon: ConfettiIcon },
  { href: "/admin/pirtis", label: "Pirtis", icon: FireIcon },
  { href: "/admin/kainos", label: "Kainodara", icon: TagIcon },
];

export function activeNavItem(pathname: string): AdminNavItem {
  return [...ADMIN_NAV].reverse().find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`)) ?? ADMIN_NAV[0];
}
