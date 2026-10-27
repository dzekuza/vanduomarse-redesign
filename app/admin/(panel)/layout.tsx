import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminBottomNav } from "@/components/admin/admin-bottom-nav";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminStoreProvider } from "@/components/admin/admin-store";
import { AdminThemeProvider } from "@/components/admin/admin-theme";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { NoAccess } from "@/components/admin/auth/no-access";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { currentStaff, loadAdminData } from "@/lib/admin/repository";
import { ADMIN_THEME_COOKIE, parseAdminTheme } from "@/lib/admin/theme";
import { createClient } from "@/lib/supabase/server";

/** Signed-in staff only. Loads every dashboard read in one go for the store. */
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { user, staff, access } = await currentStaff(supabase);
  if (!user) redirect("/admin/prisijungti");
  const email = user.email ?? "";
  if (!staff || !access) return <NoAccess email={email} />;
  if (!staff.active) return <NoAccess email={email} reason="inactive" />;
  if (!access.isOwner && access.permissions.length === 0) return <NoAccess email={email} reason="no-pages" />;

  const [data, cookieStore] = await Promise.all([loadAdminData(supabase, access), cookies()]);
  const theme = parseAdminTheme(cookieStore.get(ADMIN_THEME_COOKIE)?.value);

  return (
    <AdminStoreProvider initial={data}>
      <AdminThemeProvider initial={theme}>
        <TooltipProvider>
          <SidebarProvider className="flex-1 bg-background">
            <AppSidebar staffName={staff.display_name} />
            <SidebarInset className="min-w-0 bg-background">
              <AdminHeader />
              <main className="flex-1 pb-32 lg:pb-0">{children}</main>
            </SidebarInset>
            <AdminBottomNav />
          </SidebarProvider>
        </TooltipProvider>
      </AdminThemeProvider>
    </AdminStoreProvider>
  );
}
