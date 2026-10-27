"use client";

import { PlusIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeNavItem, NEW_BOOKING_HREF } from "./admin-nav";
import { useAdmin } from "./admin-store";
import { ThemeToggle } from "./theme-toggle";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { hasPermission } from "@/lib/admin/permissions";

/** Sticky, translucent top bar: section breadcrumb, theme switch, new-booking shortcut. */
export function AdminHeader() {
  const section = activeNavItem(usePathname());
  const { me } = useAdmin();
  const isHome = section.href === "/admin";

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-md md:px-6">
      {/* Below lg the tab bar is the navigation; the sidebar toggle is desktop-only. */}
      <SidebarTrigger className="-ml-1 hidden size-10 lg:inline-flex" />
      <Separator orientation="vertical" className="hidden h-5 lg:block" />
      <Link href="/admin" aria-label="Valdymas, apžvalga" className="lg:hidden">
        <Image src="/brand/vanduo-marse-badge.svg" alt="" width={85} height={110} className="h-9 w-auto" />
      </Link>

      <Breadcrumb className="min-w-0">
        <BreadcrumbList>
          <BreadcrumbItem className="hidden sm:inline-flex">
            {isHome ? <BreadcrumbPage>Valdymas</BreadcrumbPage> : <BreadcrumbLink asChild><Link href="/admin">Valdymas</Link></BreadcrumbLink>}
          </BreadcrumbItem>
          {isHome ? null : (
            <>
              <BreadcrumbSeparator className="hidden sm:inline-flex" />
              <BreadcrumbItem>
                <BreadcrumbPage className="truncate font-bold">{section.label}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
          {isHome ? (
            <BreadcrumbItem className="sm:hidden">
              <BreadcrumbPage className="font-bold">{section.label}</BreadcrumbPage>
            </BreadcrumbItem>
          ) : null}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        {hasPermission(me, "rezervacijos") ? (
          <Button asChild className="hidden min-h-11 active:scale-[0.98] lg:inline-flex">
            <Link href={NEW_BOOKING_HREF}>
              <PlusIcon size={18} /> Nauja rezervacija
            </Link>
          </Button>
        ) : null}
      </div>
    </header>
  );
}
