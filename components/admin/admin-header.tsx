"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeNavItem } from "./admin-nav";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

/** Sticky top bar: sidebar toggle (desktop) or badge (mobile), and the current section name. */
export function AdminHeader() {
  const section = activeNavItem(usePathname());
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4 md:px-6">
      {/* Below lg the bottom bar is the navigation; the sidebar toggle is desktop-only. */}
      <SidebarTrigger className="-ml-1 hidden size-10 lg:inline-flex" />
      <Separator orientation="vertical" className="hidden h-5 lg:block" />
      <Link href="/admin" aria-label="Valdymas, apžvalga" className="lg:hidden">
        <Image src="/brand/vanduo-marse-badge.svg" alt="" width={85} height={110} className="h-8 w-auto" />
      </Link>
      <p className="text-sm font-medium">{section.label}</p>
    </header>
  );
}
