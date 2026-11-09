"use client";

import { DotsNineIcon, PlusIcon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AdminMoreSheet } from "./admin-more-sheet";
import { flattenNav, isActiveHref, NEW_BOOKING_HREF, type AdminNavItem } from "./admin-nav";
import { useAdmin } from "./admin-store";
import { useNavCounts } from "./use-nav-counts";
import { hasPermission } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";

const SPRING = { type: "spring", stiffness: 420, damping: 34 } as const;

const TAB =
  "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors active:scale-[0.96]";

function TabBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="absolute -top-1.5 left-1/2 ml-1.5 inline-flex h-4 min-w-4 items-center justify-center bg-sidebar-primary px-1 text-xs leading-none font-bold text-sidebar-primary-foreground tabular-nums">
      {count}
    </span>
  );
}

/** The highlight behind the current tab; one shared layoutId makes it slide between tabs. */
function ActivePill() {
  return (
    <motion.span layoutId="admin-tab-pill" transition={SPRING} aria-hidden className="absolute inset-x-1 inset-y-1.5 bg-sidebar-accent">
      <span className="absolute inset-x-3 top-0 h-0.5 bg-sidebar-primary" />
    </motion.span>
  );
}

interface TabProps {
  icon: AdminNavItem["icon"];
  label: string;
  current: boolean;
  count: number;
}

function TabContent({ icon: Icon, label, current, count }: TabProps) {
  return (
    <>
      {current ? <ActivePill /> : null}
      <span className="relative">
        <Icon size={22} weight={current ? "fill" : "regular"} />
        <TabBadge count={count} />
      </span>
      <span className="relative">{label}</span>
    </>
  );
}

/**
 * Phone/tablet admin navigation: a floating aubergine bar with three main
 * tabs, a centre "new booking" button and "Daugiau" for the other sections.
 */
export function AdminBottomNav() {
  const pathname = usePathname();
  const counts = useNavCounts();
  const { me } = useAdmin();
  const nav = flattenNav(me);
  const primary = nav.filter((i) => i.primary);
  const more = nav.filter((i) => !i.primary);
  const canBook = hasPermission(me, "rezervacijos");
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = more.some((i) => isActiveHref(pathname, i.href));
  const moreCount = more.reduce((sum, i) => sum + (i.badge ? counts[i.badge] : 0), 0);
  const tone = (current: boolean) => (current ? "text-sidebar-foreground" : "text-sidebar-foreground/60");

  const tab = (item: AdminNavItem) => {
    const current = isActiveHref(pathname, item.href);
    return (
      <Link key={`${item.href}|${item.label}`} href={item.href} aria-current={current ? "page" : undefined} className={cn(TAB, tone(current))}>
        <TabContent icon={item.icon} label={item.label} current={current} count={item.badge ? counts[item.badge] : 0} />
      </Link>
    );
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <nav aria-label="Valdymo meniu" className="pointer-events-auto mx-auto flex max-w-lg items-stretch bg-sidebar px-1 shadow-float ring-1 ring-sidebar-border">
          {(canBook ? primary.slice(0, 2) : primary).map(tab)}
          {canBook ? (
            <>
              <div className="flex flex-1 items-center justify-center">
                <Link
                  href={NEW_BOOKING_HREF}
                  aria-label="Nauja rezervacija"
                  className="-mt-6 inline-flex size-14 items-center justify-center bg-sidebar-primary text-sidebar-primary-foreground shadow-float ring-4 ring-background transition-transform active:scale-[0.94]"
                >
                  <PlusIcon size={26} weight="bold" />
                </Link>
              </div>
              {primary.slice(2).map(tab)}
            </>
          ) : null}
          <button type="button" aria-expanded={moreOpen} onClick={() => setMoreOpen(true)} className={cn(TAB, tone(moreActive))}>
            <TabContent icon={DotsNineIcon} label="Daugiau" current={moreActive} count={moreCount} />
          </button>
        </nav>
      </div>

      <AdminMoreSheet open={moreOpen} onOpenChange={setMoreOpen} items={more} pathname={pathname} counts={counts} />
    </>
  );
}
