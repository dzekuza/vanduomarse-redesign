"use client";

import { ArrowSquareOutIcon, CaretDownIcon, KeyIcon, SignOutIcon } from "@phosphor-icons/react";
import { signOut } from "@/app/admin/actions";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ADMIN_NAV_GROUPS, activeNavItem, isActiveHref, isDomain, visibleNav, type AdminNavDomain } from "./admin-nav";
import { useAdmin } from "./admin-store";
import { ChangePasswordDialog } from "./change-password-dialog";
import { StaffAvatar } from "./staff-avatar";
import { useNavCounts } from "./use-nav-counts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

/* Coral marker on the active row; shadcn already handles the active fill. */
const ACTIVE_MARKER =
  "relative data-active:before:absolute data-active:before:inset-y-2 data-active:before:left-0 data-active:before:w-1 data-active:before:bg-sidebar-primary data-active:[&_svg]:text-sidebar-primary";

/** Desktop admin navigation: grouped sections, live counts, staff footer. */
export function AppSidebar({ staffName }: { staffName: string }) {
  const pathname = usePathname();
  const active = activeNavItem(pathname);
  const counts = useNavCounts();
  const { me } = useAdmin();
  const nav = visibleNav(me);
  const [passwordOpen, setPasswordOpen] = useState(false);
  /** Explicit open/closed per domain; falls back to "open if it holds the active route" until toggled. */
  const [openDomains, setOpenDomains] = useState<Record<string, boolean>>({});
  const domainOpen = (domain: AdminNavDomain) => openDomains[domain.id] ?? domain.id === active.domainId;

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
        {ADMIN_NAV_GROUPS.filter((group) => nav.some((entry) => entry.group === group.id)).map((group) => (
          <SidebarGroup key={group.id}>
            {group.label ? <SidebarGroupLabel className="text-sidebar-foreground/50">{group.label}</SidebarGroupLabel> : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {nav
                  .filter((entry) => entry.group === group.id)
                  .map((entry) => {
                    if (isDomain(entry)) {
                      const Icon = entry.icon;
                      const open = domainOpen(entry);
                      const current = entry.children.some((c) => isActiveHref(pathname, c.href));
                      const count = entry.children.reduce((sum, c) => sum + (c.badge ? counts[c.badge] : 0), 0);
                      return (
                        <Collapsible key={entry.id} open={open} onOpenChange={(o) => setOpenDomains((s) => ({ ...s, [entry.id]: o }))} className="group/collapsible">
                          <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton isActive={current} tooltip={entry.label} size="lg" className={ACTIVE_MARKER}>
                                <Icon size={20} weight={current ? "fill" : "regular"} />
                                <span className="group-data-[collapsible=icon]:hidden">{entry.label}</span>
                                <CaretDownIcon
                                  size={14}
                                  className="ml-auto shrink-0 transition-transform group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-180"
                                />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            {count > 0 ? (
                              <SidebarMenuBadge className="right-7 bg-sidebar-primary text-sidebar-primary-foreground peer-data-active/menu-button:text-sidebar-primary-foreground">
                                {count}
                              </SidebarMenuBadge>
                            ) : null}
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {entry.children.map((child) => {
                                  const ChildIcon = child.icon;
                                  const childCurrent = isActiveHref(pathname, child.href);
                                  return (
                                    <SidebarMenuSubItem key={`${child.href}|${child.label}`}>
                                      <SidebarMenuSubButton asChild isActive={childCurrent}>
                                        <Link href={child.href} aria-current={childCurrent ? "page" : undefined}>
                                          <ChildIcon size={16} weight={childCurrent ? "fill" : "regular"} />
                                          <span>{child.label}</span>
                                        </Link>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  );
                                })}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>
                      );
                    }

                    const Icon = entry.icon;
                    const current = isActiveHref(pathname, entry.href);
                    const count = entry.badge ? counts[entry.badge] : 0;
                    return (
                      <SidebarMenuItem key={entry.href}>
                        <SidebarMenuButton asChild isActive={current} tooltip={entry.label} size="lg" className={ACTIVE_MARKER}>
                          <Link href={entry.href} aria-current={current ? "page" : undefined}>
                            <Icon size={20} weight={current ? "fill" : "regular"} />
                            <span className="group-data-[collapsible=icon]:hidden">{entry.label}</span>
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
