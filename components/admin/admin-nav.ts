import type { Icon } from "@phosphor-icons/react";
import { CalendarCheckIcon, CalendarDotsIcon, ChartPieSliceIcon, ConfettiIcon, EnvelopeSimpleIcon, FireIcon, GiftIcon, MotorcycleIcon, PercentIcon, ScanIcon, TagIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { hasPermission, STAFF_HREF, type PermissionId, type StaffAccess } from "@/lib/admin/permissions";

export type AdminNavGroup = "apzvalga" | "pardavimai" | "turinys" | "nustatymai";

/** `label: null` renders no group header (just Apžvalga, kept out of Pardavimai per the dashboard-merge sitemap, ADR-0040). */
export const ADMIN_NAV_GROUPS: { id: AdminNavGroup; label: string | null }[] = [
  { id: "apzvalga", label: null },
  { id: "pardavimai", label: "Pardavimai" },
  { id: "turinys", label: "Turinys" },
  { id: "nustatymai", label: "Nustatymai" },
];

export interface AdminNavItem {
  href: string;
  label: string;
  icon: Icon;
  group: AdminNavGroup;
  /** Page permission needed to see this item; `"owner"` for staff management. */
  permission: PermissionId | "owner";
  /** Store-driven count shown as a badge. */
  badge?: "pendingBookings" | "newInquiries" | "pendingCoupons" | "pendingQuads" | "pendingEvents";
  /** Shown directly in the mobile tab bar; the rest live under "Daugiau". */
  primary?: boolean;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Apžvalga", icon: ChartPieSliceIcon, group: "apzvalga", permission: "apzvalga", primary: true },
  { href: "/admin/rezervacijos", label: "Rezervacijos", icon: CalendarCheckIcon, group: "pardavimai", permission: "rezervacijos", badge: "pendingBookings", primary: true },
  { href: "/admin/uzimtumas", label: "Užimtumas", icon: CalendarDotsIcon, group: "pardavimai", permission: "uzimtumas", primary: true },
  { href: "/admin/keturraciai", label: "Keturračiai", icon: MotorcycleIcon, group: "pardavimai", permission: "keturraciai", badge: "pendingQuads" },
  { href: "/admin/kuponai", label: "Kuponai", icon: GiftIcon, group: "pardavimai", permission: "kuponai", badge: "pendingCoupons" },
  { href: "/admin/apyrankes", label: "Apyrankės", icon: ScanIcon, group: "pardavimai", permission: "apyrankes" },
  { href: "/admin/uzklausos", label: "Užklausos", icon: EnvelopeSimpleIcon, group: "pardavimai", permission: "uzklausos", badge: "newInquiries" },
  { href: "/admin/renginiai", label: "Renginiai", icon: ConfettiIcon, group: "turinys", permission: "renginiai", badge: "pendingEvents" },
  { href: "/admin/nuolaidos", label: "Nuolaidos", icon: PercentIcon, group: "turinys", permission: "nuolaidos" },
  { href: "/admin/pirtis", label: "Pirtis", icon: FireIcon, group: "nustatymai", permission: "pirtis" },
  { href: "/admin/kainos", label: "Kainodara", icon: TagIcon, group: "nustatymai", permission: "kainos" },
  { href: STAFF_HREF, label: "Darbuotojai", icon: UsersThreeIcon, group: "nustatymai", permission: "owner" },
];

/** Where the "new booking" shortcuts (header button, tab bar +) lead. */
export const NEW_BOOKING_HREF = "/admin/rezervacijos?nauja=1";

/** Whether this person's role opens the item. */
export const canOpen = (item: AdminNavItem, access: StaffAccess) => (item.permission === "owner" ? access.isOwner : hasPermission(access, item.permission));

/** The menu for one person: only the pages their role allows. */
export const visibleNav = (access: StaffAccess) => ADMIN_NAV.filter((item) => canOpen(item, access));

export function activeNavItem(pathname: string): AdminNavItem {
  return [...ADMIN_NAV].reverse().find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`)) ?? ADMIN_NAV[0];
}
