import type { Metadata } from "next";
import { AdminBottomNav } from "@/components/admin/admin-bottom-nav";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminStoreProvider } from "@/components/admin/admin-store";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: { default: "Valdymas", template: "%s · Vanduo Marse valdymas" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AdminStoreProvider>
      <TooltipProvider>
        <SidebarProvider className="flex-1 bg-background">
          <AppSidebar />
          <SidebarInset className="min-w-0 bg-background">
            <AdminHeader />
            <main className="flex-1 pb-24 lg:pb-0">{children}</main>
          </SidebarInset>
          <AdminBottomNav />
        </SidebarProvider>
        <Toaster theme="light" position="bottom-right" mobileOffset={{ bottom: 96 }} />
      </TooltipProvider>
    </AdminStoreProvider>
  );
}
