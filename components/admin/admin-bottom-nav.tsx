"use client";

import { ArrowSquareOutIcon, DotsThreeOutlineIcon, SignOutIcon } from "@phosphor-icons/react";
import { signOut } from "@/app/admin/actions";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ADMIN_NAV, activeNavItem, type AdminNavItem } from "./admin-nav";
import { useNavCounts } from "./use-nav-counts";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const PRIMARY = ADMIN_NAV.filter((i) => i.primary);
const MORE = ADMIN_NAV.filter((i) => !i.primary);

function TabBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="absolute -top-1.5 left-1/2 ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rust px-1 text-xs leading-none font-bold text-foam tabular-nums">
      {count}
    </span>
  );
}

const TAB = "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors";

/** Phone/tablet admin navigation: four main tabs plus "Daugiau" for the rest. */
export function AdminBottomNav() {
  const active = activeNavItem(usePathname());
  const counts = useNavCounts();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE.some((i) => i.href === active.href);

  const tab = (item: AdminNavItem) => {
    const Icon = item.icon;
    const current = item.href === active.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={current ? "page" : undefined}
        className={`${TAB} ${current ? "text-rust before:absolute before:inset-x-3 before:top-0 before:h-0.5 before:bg-rust" : "text-muted-foreground"}`}
      >
        <span className="relative">
          <Icon size={22} weight={current ? "fill" : "regular"} />
          <TabBadge count={item.badge ? counts[item.badge] : 0} />
        </span>
        {item.label}
      </Link>
    );
  };

  return (
    <>
      <nav aria-label="Valdymo meniu" className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="flex">
          {PRIMARY.map(tab)}
          <button
            type="button"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen(true)}
            className={`${TAB} ${moreActive ? "text-rust before:absolute before:inset-x-3 before:top-0 before:h-0.5 before:bg-rust" : "text-muted-foreground"}`}
          >
            <DotsThreeOutlineIcon size={22} weight={moreActive ? "fill" : "regular"} />
            Daugiau
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="pb-[env(safe-area-inset-bottom)] lg:hidden">
          <SheetHeader>
            <SheetTitle>Daugiau</SheetTitle>
            <SheetDescription>Kiti valdymo skyriai.</SheetDescription>
          </SheetHeader>
          <ul className="divide-y px-4 pb-4">
            {MORE.map((item) => {
              const Icon = item.icon;
              const current = item.href === active.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    aria-current={current ? "page" : undefined}
                    className={`flex min-h-14 items-center gap-3 text-base ${current ? "text-rust" : ""}`}
                  >
                    <Icon size={22} /> {item.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link href="/" className="flex min-h-14 items-center gap-3 text-base text-muted-foreground">
                <ArrowSquareOutIcon size={22} /> Į svetainę
              </Link>
            </li>
            <li>
              <form action={signOut}>
                <button type="submit" className="flex min-h-14 w-full items-center gap-3 text-base text-muted-foreground">
                  <SignOutIcon size={22} /> Atsijungti
                </button>
              </form>
            </li>
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}
