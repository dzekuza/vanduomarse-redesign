import { redirect } from "next/navigation";
import { AdminBottomNav } from "@/components/admin/admin-bottom-nav";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminStoreProvider } from "@/components/admin/admin-store";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { NoAccess } from "@/components/admin/auth/no-access";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { currentStaff, loadAdminData } from "@/lib/admin/repository";
import { createClient } from "@/lib/supabase/server";

/** Signed-in staff only. Loads every dashboard read in one go for the store. */
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { user, staff } = await currentStaff(supabase);
  if (!user) redirect("/admin/prisijungti");
  if (!staff) return <NoAccess email={user.email ?? ""} />;

  const data = await loadAdminData(supabase);

  return (
    <AdminStoreProvider initial={data}>
      <TooltipProvider>
        <SidebarProvider className="flex-1 bg-background">
          <AppSidebar staffName={staff.display_name} />
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
