"use client";

import { ArrowSquareOutIcon, KeyIcon, SignOutIcon } from "@phosphor-icons/react";
import { signOut } from "@/app/admin/actions";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ADMIN_NAV_GROUPS, activeNavItem, visibleNav } from "./admin-nav";
import { useAdmin } from "./admin-store";
import { ChangePasswordDialog } from "./change-password-dialog";
import { StaffAvatar } from "./staff-avatar";
import { useNavCounts } from "./use-nav-counts";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

/* Coral marker on the active row; shadcn already handles the active fill. */
const ACTIVE_MARKER =
  "relative data-active:before:absolute data-active:before:inset-y-2 data-active:before:left-0 data-active:before:w-1 data-active:before:bg-sidebar-primary data-active:[&_svg]:text-sidebar-primary";

/** Desktop admin navigation: grouped sections, live counts, staff footer. */
export function AppSidebar({ staffName }: { staffName: string }) {
  const active = activeNavItem(usePathname());
  const counts = useNavCounts();
  const { me } = useAdmin();
  const nav = visibleNav(me);
  const [passwordOpen, setPasswordOpen] = useState(false);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link href="/admin" className="flex items-center gap-3 px-1 py-1">
          <Image src="/brand/vanduo-marse-badge.svg" alt="" width={85} height={110} className="h-9 w-auto shrink-0" />
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="font-display block truncate text-sm font-bold">Vanduo Marse</span>
            <span className="block text-xs text-sidebar-foreground/60">Valdymas</span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {ADMIN_NAV_GROUPS.filter((group) => nav.some((item) => item.group === group.id)).map((group) => (
          <SidebarGroup key={group.id}>
            {group.label ? <SidebarGroupLabel className="text-sidebar-foreground/50">{group.label}</SidebarGroupLabel> : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {nav.filter((item) => item.group === group.id).map((item) => {
                  const Icon = item.icon;
                  const current = item.href === active.href;
                  const count = item.badge ? counts[item.badge] : 0;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={current} tooltip={item.label} size="lg" className={ACTIVE_MARKER}>
                        <Link href={item.href} aria-current={current ? "page" : undefined}>
                          <Icon size={20} weight={current ? "fill" : "regular"} />
                          <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                      {count > 0 ? (
                        <SidebarMenuBadge className="bg-sidebar-primary text-sidebar-primary-foreground peer-data-active/menu-button:text-sidebar-primary-foreground">
                          {count}
                        </SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Į svetainę">
              <Link href="/">
                <ArrowSquareOutIcon size={18} />
                <span className="group-data-[collapsible=icon]:hidden">Į svetainę</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex items-center gap-3 p-1 group-data-[collapsible=icon]:p-0">
          <StaffAvatar name={staffName} className="group-data-[collapsible=icon]:size-8" />
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-bold">{staffName}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{me.roleName}</p>
          </div>
          <button
            type="button"
            aria-label="Keisti slaptažodį"
            title="Keisti slaptažodį"
            onClick={() => setPasswordOpen(true)}
            className="inline-flex size-11 items-center justify-center text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden"
          >
            <KeyIcon size={18} />
          </button>
          <form action={signOut} className="group-data-[collapsible=icon]:hidden">
            <button
              type="submit"
              aria-label="Atsijungti"
              title="Atsijungti"
              className="inline-flex size-11 items-center justify-center text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <SignOutIcon size={18} />
            </button>
          </form>
        </div>
      </SidebarFooter>
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </Sidebar>
  );
}
