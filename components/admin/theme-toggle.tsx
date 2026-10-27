"use client";

import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useAdminTheme } from "./admin-theme";
import { Button } from "@/components/ui/button";

/** Light/dark switch for the admin panel; the icon rolls between sun and moon. */
export function ThemeToggle() {
  const { theme, toggleTheme } = useAdminTheme();
  const dark = theme === "dark";
  const label = dark ? "Šviesi tema" : "Tamsi tema";

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={label} title={label} className="size-11 overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ y: 12, opacity: 0, rotate: -30 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -12, opacity: 0, rotate: 30 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="inline-flex"
        >
          {dark ? <SunIcon size={20} /> : <MoonIcon size={20} />}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
