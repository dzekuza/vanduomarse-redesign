"use client";

import { ArrowSquareOutIcon, SignOutIcon } from "@phosphor-icons/react";
import { signOut } from "@/app/admin/actions";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV, activeNavItem } from "./admin-nav";
import { useNavCounts } from "./use-nav-counts";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

/** Admin navigation with live counts for work waiting on staff. */
export function AppSidebar({ staffName }: { staffName: string }) {
  const pathname = usePathname();
  const active = activeNavItem(pathname);
  const counts = useNavCounts();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link href="/admin" className="flex items-center gap-3 px-1 py-1" onClick={() => setOpenMobile(false)}>
          <Image src="/brand/vanduo-marse-badge.svg" alt="" width={85} height={110} className="h-9 w-auto shrink-0" />
          <span className="font-display truncate text-sm font-bold group-data-[collapsible=icon]:hidden">Valdymas</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {ADMIN_NAV.map((item) => {
                const Icon = item.icon;
                const count = item.badge ? counts[item.badge] : 0;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={item.href === active.href} tooltip={item.label} size="lg">
                      <Link href={item.href} onClick={() => setOpenMobile(false)}>
                        <Icon size={20} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {count > 0 ? <SidebarMenuBadge className="bg-rust text-foam">{count}</SidebarMenuBadge> : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <p className="truncate px-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">{staffName}</p>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Į svetainę">
              <Link href="/">
                <ArrowSquareOutIcon size={18} />
                <span>Į svetainę</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={signOut}>
              <SidebarMenuButton type="submit" tooltip="Atsijungti">
                <SignOutIcon size={18} />
                <span>Atsijungti</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
