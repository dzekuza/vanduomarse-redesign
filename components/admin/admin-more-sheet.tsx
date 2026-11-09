"use client";

import { ArrowSquareOutIcon, KeyIcon, MoonIcon, SignOutIcon, SunIcon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { signOut } from "@/app/admin/actions";
import { isActiveHref, type AdminNavItem } from "./admin-nav";
import { useAdminTheme } from "./admin-theme";
import { ChangePasswordDialog } from "./change-password-dialog";
import type { useNavCounts } from "./use-nav-counts";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const TILE =
  "relative flex min-h-24 flex-col items-start justify-between gap-3 border bg-card p-3 text-sm transition-colors active:scale-[0.98]";
const ROW = "flex min-h-12 w-full items-center gap-3 px-1 text-base text-muted-foreground transition-colors hover:text-foreground";

interface MoreTileProps {
  item: AdminNavItem;
  current: boolean;
  count: number;
  index: number;
  onNavigate: () => void;
}

/** One section shortcut in the "Daugiau" grid; tiles cascade in on open. */
function MoreTile({ item, current, count, index, onNavigate }: MoreTileProps) {
  const Icon = item.icon;
  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 24, delay: index * 0.05 }}
    >
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={current ? "page" : undefined}
        className={cn(TILE, current ? "border-status-pending" : "hover:border-foreground/40")}
      >
        <Icon size={24} weight={current ? "fill" : "regular"} className={current ? "text-status-pending" : undefined} />
        <span className="font-bold">{item.label}</span>
        {count > 0 ? (
          <span className="absolute top-3 right-3 bg-status-pending px-1.5 text-xs leading-5 font-bold text-sidebar-primary-foreground tabular-nums">
            {count}
          </span>
        ) : null}
      </Link>
    </motion.li>
  );
}

interface AdminMoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: AdminNavItem[];
  pathname: string;
  counts: ReturnType<typeof useNavCounts>;
}

/** Bottom sheet behind the tab bar's "Daugiau": the remaining sections plus account actions. */
export function AdminMoreSheet({ open, onOpenChange, items, pathname, counts }: AdminMoreSheetProps) {
  const { theme, toggleTheme } = useAdminTheme();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
        <SheetHeader>
          <SheetTitle className="font-display">Daugiau</SheetTitle>
          <SheetDescription>Kiti valdymo skyriai ir paskyra.</SheetDescription>
        </SheetHeader>
        <ul className="grid grid-cols-2 gap-2 px-4 sm:grid-cols-4">
          {items.map((item, index) => (
            <MoreTile
              key={`${item.href}|${item.label}`}
              item={item}
              index={index}
              current={isActiveHref(pathname, item.href)}
              count={item.badge ? counts[item.badge] : 0}
              onNavigate={close}
            />
          ))}
        </ul>
        <ul className="mx-4 mt-2 divide-y border-t">
          <li>
            <button type="button" onClick={toggleTheme} className={ROW}>
              {theme === "dark" ? <SunIcon size={22} /> : <MoonIcon size={22} />}
              {theme === "dark" ? "Šviesi tema" : "Tamsi tema"}
            </button>
          </li>
          <li>
            <Link href="/" className={ROW}>
              <ArrowSquareOutIcon size={22} /> Į svetainę
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                close();
                setPasswordOpen(true);
              }}
              className={ROW}
            >
              <KeyIcon size={22} /> Keisti slaptažodį
            </button>
          </li>
          <li>
            <form action={signOut}>
              <button type="submit" className={ROW}>
                <SignOutIcon size={22} /> Atsijungti
              </button>
            </form>
          </li>
        </ul>
      </SheetContent>
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </Sheet>
  );
}
