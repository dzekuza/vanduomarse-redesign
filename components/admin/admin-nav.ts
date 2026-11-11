import type { Icon } from "@phosphor-icons/react";
import {
  AddressBookIcon,
  BedIcon,
  BellRingingIcon,
  CalendarBlankIcon,
  ChartPieSliceIcon,
  ConfettiIcon,
  EnvelopeSimpleIcon,
  FireIcon,
  GlobeHemisphereWestIcon,
  GiftIcon,
  LifebuoyIcon,
  MotorcycleIcon,
  PercentIcon,
  PersonSimpleSnowboardIcon,
  ScanIcon,
  TagIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import { hasPermission, NOTIFICATIONS_HREF, SITE_SETTINGS_HREF, STAFF_HREF, type PermissionId, type StaffAccess } from "@/lib/admin/permissions";

export type AdminNavGroup = "apzvalga" | "pardavimai" | "turinys" | "nustatymai";

/** `label: null` renders no group header (the top group: Apžvalga, Klientai, Užklausos, Kalendorius). */
export const ADMIN_NAV_GROUPS: { id: AdminNavGroup; label: string | null }[] = [
  { id: "apzvalga", label: null },
  { id: "pardavimai", label: "Paslaugos" },
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
  badge?: "pendingBookings" | "newInquiries" | "pendingCoupons" | "pendingQuads" | "pendingEvents" | "pendingAll";
  /** Shown directly in the mobile tab bar; the rest live under "Daugiau". */
  primary?: boolean;
}

/**
 * A sidebar row that expands into its own pages instead of being one itself.
 * Pirtis, Namukai and Keturračiai each split into a shared booking calendar
 * (Kalendorius) and that resource's own settings (Valdymas), per the owner's
 * sitemap (ADR-0045). `id` is a local key for expand/collapse state, not a
 * route; the row is visible only while at least one child is.
 */
export interface AdminNavDomain {
  id: string;
  label: string;
  icon: Icon;
  group: AdminNavGroup;
  children: AdminNavItem[];
}

export type AdminNavEntry = AdminNavItem | AdminNavDomain;

export const isDomain = (entry: AdminNavEntry): entry is AdminNavDomain => "children" in entry;

/**
 * Mostly plain links: Kalendorius (all bookings and events), then each
 * resource's own page. Cabins and camper pitches are managed by the owner at
 * Namukai (`/admin/namukai`, ADR-0058). The one dropdown is Vandenlentės, which holds
 * the wristband and instructor pages (`AdminNavDomain`).
 */
export const ADMIN_NAV: AdminNavEntry[] = [
  { href: "/admin", label: "Apžvalga", icon: ChartPieSliceIcon, group: "apzvalga", permission: "apzvalga", badge: "pendingAll", primary: true },
  { href: "/admin/klientai", label: "Klientai", icon: AddressBookIcon, group: "apzvalga", permission: "klientai", primary: true },
  { href: "/admin/uzklausos", label: "Užklausos", icon: EnvelopeSimpleIcon, group: "apzvalga", permission: "uzklausos", badge: "newInquiries" },
  { href: "/admin/kalendorius", label: "Kalendorius", icon: CalendarBlankIcon, group: "apzvalga", permission: "rezervacijos", badge: "pendingBookings", primary: true },
  { href: "/admin/pirtis", label: "Pirtis", icon: FireIcon, group: "pardavimai", permission: "pirtis" },
  { href: "/admin/namukai", label: "Namukai", icon: BedIcon, group: "pardavimai", permission: "owner" },
  { href: "/admin/keturraciai", label: "Keturračiai", icon: MotorcycleIcon, group: "pardavimai", permission: "keturraciai", badge: "pendingQuads" },
  {
    id: "vandenlentes",
    label: "Vandenlentės",
    icon: PersonSimpleSnowboardIcon,
    group: "pardavimai",
    children: [
      { href: "/admin/apyrankes", label: "Apyrankės", icon: ScanIcon, group: "pardavimai", permission: "apyrankes" },
      { href: "/admin/instruktorius", label: "Instruktorius", icon: LifebuoyIcon, group: "pardavimai", permission: "instruktorius" },
    ],
  },
  { href: "/admin/renginiai", label: "Renginiai", icon: ConfettiIcon, group: "turinys", permission: "renginiai", badge: "pendingEvents" },
  { href: "/admin/kainos", label: "Kainodara", icon: TagIcon, group: "nustatymai", permission: "kainos" },
  { href: "/admin/kuponai", label: "Kuponai", icon: GiftIcon, group: "nustatymai", permission: "kuponai", badge: "pendingCoupons" },
  { href: "/admin/nuolaidos", label: "Nuolaidos", icon: PercentIcon, group: "nustatymai", permission: "nuolaidos" },
  { href: STAFF_HREF, label: "Darbuotojai", icon: UsersThreeIcon, group: "nustatymai", permission: "owner" },
  { href: NOTIFICATIONS_HREF, label: "Pranešimai", icon: BellRingingIcon, group: "nustatymai", permission: "owner" },
  { href: SITE_SETTINGS_HREF, label: "Svetainė", icon: GlobeHemisphereWestIcon, group: "nustatymai", permission: "owner" },
];

/** Where the "new booking" shortcuts (header button, tab bar +) lead. */
export const NEW_BOOKING_HREF = "/admin/rezervacijos?nauja=1";

/** Whether this person's role opens the item. */
export const canOpen = (item: AdminNavItem, access: StaffAccess) => (item.permission === "owner" ? access.isOwner : hasPermission(access, item.permission));

/** The sidebar tree for one person: a domain keeps only the children their role opens, and drops out entirely with none left. */
export function visibleNav(access: StaffAccess): AdminNavEntry[] {
  return ADMIN_NAV.flatMap<AdminNavEntry>((entry) => {
    if (!isDomain(entry)) return canOpen(entry, access) ? [entry] : [];
    const children = entry.children.filter((child) => canOpen(child, access));
    return children.length ? [{ ...entry, children }] : [];
  });
}

/** The same menu flattened for mobile (bottom tab bar, "Daugiau" sheet) — no room for a tree there. */
export function flattenNav(access: StaffAccess): AdminNavItem[] {
  return ADMIN_NAV.flatMap((entry) => (isDomain(entry) ? entry.children : [entry])).filter((item) => canOpen(item, access));
}

const hrefPath = (href: string) => href.split("?")[0];

/** Path-only match — a child's href can carry a `?view=`/`?tab=` query the current pathname never includes. */
export const isActiveHref = (pathname: string, href: string) => {
  const path = hrefPath(href);
  return pathname === path || pathname.startsWith(`${path}/`);
};

/** The current leaf (for the breadcrumb) and, if it's a domain's child, that domain's id — so the sidebar can auto-expand it. */
export function activeNavItem(pathname: string): { item: AdminNavItem; domainId: string | null } {
  for (const entry of ADMIN_NAV) {
    if (isDomain(entry)) {
      const child = entry.children.find((c) => isActiveHref(pathname, c.href));
      if (child) return { item: child, domainId: entry.id };
    } else if (isActiveHref(pathname, entry.href)) {
      return { item: entry, domainId: null };
    }
  }
  const first = ADMIN_NAV[0];
  return isDomain(first) ? { item: first.children[0], domainId: first.id } : { item: first, domainId: null };
}
