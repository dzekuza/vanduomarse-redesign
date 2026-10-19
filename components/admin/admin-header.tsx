"use client";

import { usePathname } from "next/navigation";
import { activeNavItem } from "./admin-nav";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

/** Sticky top bar: sidebar toggle and the current section name. */
export function AdminHeader() {
  const section = activeNavItem(usePathname());
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4 md:px-6">
      <SidebarTrigger className="-ml-1 size-10" />
      <Separator orientation="vertical" className="h-5" />
      <p className="text-sm font-medium">{section.label}</p>
    </header>
  );
}
