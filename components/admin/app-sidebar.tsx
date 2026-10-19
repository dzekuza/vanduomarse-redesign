"use client";

import { ArrowSquareOutIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV, activeNavItem } from "./admin-nav";
import { useAdmin } from "./admin-store";
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
export function AppSidebar() {
  const pathname = usePathname();
  const active = activeNavItem(pathname);
  const { bookings, inquiries } = useAdmin();
  const { setOpenMobile } = useSidebar();
  const counts = {
    pendingBookings: bookings.filter((b) => b.status === "laukia").length,
    newInquiries: inquiries.filter((q) => q.status === "nauja").length,
  };

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
        <p className="px-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          Demonstraciniai duomenys: pakeitimai neišsaugomi.
        </p>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Į svetainę">
              <Link href="/">
                <ArrowSquareOutIcon size={18} />
                <span>Į svetainę</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
