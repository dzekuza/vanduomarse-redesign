"use client";

import { MotionConfig } from "motion/react";
import { createContext, use, useEffect, useState } from "react";
import { ADMIN_THEME_COOKIE, type AdminTheme } from "@/lib/admin/theme";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

interface AdminThemeContextValue {
  theme: AdminTheme;
  toggleTheme: () => void;
}

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

export function useAdminTheme(): AdminThemeContextValue {
  const value = use(AdminThemeContext);
  if (!value) throw new Error("useAdminTheme must be used inside AdminThemeProvider");
  return value;
}

const ONE_YEAR = 60 * 60 * 24 * 365;

interface AdminThemeProviderProps {
  /** Read from the cookie on the server, so the first paint is already right. */
  initial: AdminTheme;
  children: React.ReactNode;
}

/**
 * Scopes dark mode to the admin panel: `.dark` sits on this wrapper (server
 * rendered) and on <html> while mounted, so portalled sheets, dialogs and
 * toasts match. Leaving the panel removes it, so the public site stays light.
 */
export function AdminThemeProvider({ initial, children }: AdminThemeProviderProps) {
  const [theme, setTheme] = useState(initial);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    return () => root.classList.remove("dark");
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.cookie = `${ADMIN_THEME_COOKIE}=${next}; path=/admin; max-age=${ONE_YEAR}; samesite=lax`;
    setTheme(next);
  };

  return (
    <AdminThemeContext value={{ theme, toggleTheme }}>
      <div className={cn("flex flex-1 flex-col bg-background text-foreground", theme === "dark" && "dark")}>
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
        <Toaster theme={theme} position="bottom-right" mobileOffset={{ bottom: 104 }} />
      </div>
    </AdminThemeContext>
  );
}
