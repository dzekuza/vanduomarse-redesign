import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

/**
 * Design system tokens for the Vanduo Marse React Native mobile admin app.
 *
 * Per `obsidian/frontend/design-system.md`:
 * "Mobile (React Native): every colour/spacing/radius comes from `useAppTheme()`;
 *  no raw hex or numbers in `StyleSheet.create()`."
 *
 * All values mirror `app/globals.css` (`.theme-marse` light and `.dark` admin modes).
 */

export type ThemeMode = "light" | "dark";

const RAW = {
  aubergine: "#382e38",
  aubergineSoft: "#4a3e4a",
  aubergineDeep: "#171317",
  aubergineNight: "#1f1a1f",
  aubergineDusk: "#2a232a",
  aubergineHaze: "#5a4c5a",
  publicBackground: "#eed9ce",
  blush: "#f1d8ce",
  blushSoft: "#f7e7e0",
  blushPaper: "#fbf3ef",
  warmWhite: "#fffaf7",
  coral: "#ed5257",
  coralInk: "#a8282d",
  destructive: "#c73a3f",
  tan: "#e2b38c",
  tealDeep: "#015059",
  teal: "#00b2b5",
  mauve: "#b9a9b3",
  mutedInk: "#6e626d",
  statusDoneLight: "#8f838e",
  statusWarn: "#e5b400",
  statusOk: "#2f9e63",
  statusBad: "#e0464d",
  calendarBrown: "#9d806c",
  calendarPink: "#d96ba3",
  borderLight: "rgba(56, 46, 56, 0.18)",
  borderDark: "rgba(251, 243, 239, 0.14)",
  inputLight: "rgba(56, 46, 56, 0.28)",
  inputDark: "rgba(251, 243, 239, 0.22)",
  overlayBackdrop: "rgba(23, 19, 23, 0.65)",
  transparent: "transparent",
} as const;

export interface AppColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  border: string;
  input: string;
  ring: string;
  ink: string;
  inkSoft: string;
  rust: string;
  rustInk: string;
  onRust: string;
  lake: string;
  lakeSoft: string;
  dust: string;
  dustSoft: string;
  foam: string;
  water: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarBorder: string;
  statusPending: string;
  statusConfirmed: string;
  statusNew: string;
  statusDone: string;
  statusWarn: string;
  statusOk: string;
  statusBad: string;
  calendarBrown: string;
  calendarPink: string;
  backdrop: string;
  transparent: string;
}

const LIGHT_COLORS: AppColors = {
  background: RAW.blushPaper,
  foreground: RAW.aubergine,
  card: RAW.warmWhite,
  cardForeground: RAW.aubergine,
  popover: RAW.warmWhite,
  popoverForeground: RAW.aubergine,
  primary: RAW.aubergine,
  primaryForeground: RAW.blushPaper,
  secondary: RAW.blush,
  secondaryForeground: RAW.aubergine,
  muted: RAW.blushSoft,
  mutedForeground: RAW.mutedInk,
  accent: RAW.blush,
  accentForeground: RAW.aubergine,
  destructive: RAW.destructive,
  border: RAW.borderLight,
  input: RAW.inputLight,
  ring: RAW.coralInk,
  ink: RAW.aubergine,
  inkSoft: RAW.aubergineSoft,
  rust: RAW.coral,
  rustInk: RAW.coralInk,
  onRust: RAW.aubergineDeep,
  lake: RAW.tan,
  lakeSoft: RAW.tealDeep,
  dust: RAW.publicBackground,
  dustSoft: RAW.blushSoft,
  foam: RAW.blushPaper,
  water: RAW.teal,
  sidebar: RAW.aubergine,
  sidebarForeground: RAW.blushPaper,
  sidebarPrimary: RAW.coral,
  sidebarPrimaryForeground: RAW.blushPaper,
  sidebarAccent: RAW.aubergineSoft,
  sidebarBorder: RAW.borderDark,
  statusPending: RAW.coral,
  statusConfirmed: RAW.tealDeep,
  statusNew: RAW.tan,
  statusDone: RAW.statusDoneLight,
  statusWarn: RAW.statusWarn,
  statusOk: RAW.statusOk,
  statusBad: RAW.statusBad,
  calendarBrown: RAW.calendarBrown,
  calendarPink: RAW.calendarPink,
  backdrop: RAW.overlayBackdrop,
  transparent: RAW.transparent,
};

const DARK_COLORS: AppColors = {
  background: RAW.aubergineNight,
  foreground: RAW.blushPaper,
  card: RAW.aubergineDusk,
  cardForeground: RAW.blushPaper,
  popover: RAW.aubergineDusk,
  popoverForeground: RAW.blushPaper,
  primary: RAW.blush,
  primaryForeground: RAW.aubergine,
  secondary: RAW.aubergine,
  secondaryForeground: RAW.blushPaper,
  muted: RAW.aubergine,
  mutedForeground: RAW.mauve,
  accent: RAW.aubergineSoft,
  accentForeground: RAW.blushPaper,
  destructive: RAW.coral,
  border: RAW.borderDark,
  input: RAW.inputDark,
  ring: RAW.coral,
  ink: RAW.aubergineHaze,
  inkSoft: RAW.aubergineSoft,
  rust: RAW.coral,
  rustInk: RAW.coral,
  onRust: RAW.aubergineDeep,
  lake: RAW.tan,
  lakeSoft: RAW.teal,
  dust: RAW.aubergineNight,
  dustSoft: RAW.aubergineDusk,
  foam: RAW.blushPaper,
  water: RAW.teal,
  sidebar: RAW.aubergineDeep,
  sidebarForeground: RAW.blushPaper,
  sidebarPrimary: RAW.coral,
  sidebarPrimaryForeground: RAW.blushPaper,
  sidebarAccent: RAW.aubergineDusk,
  sidebarBorder: RAW.borderDark,
  statusPending: RAW.coral,
  statusConfirmed: RAW.teal,
  statusNew: RAW.tan,
  statusDone: RAW.mauve,
  statusWarn: RAW.statusWarn,
  statusOk: RAW.statusOk,
  statusBad: RAW.statusBad,
  calendarBrown: RAW.calendarBrown,
  calendarPink: RAW.calendarPink,
  backdrop: RAW.overlayBackdrop,
  transparent: RAW.transparent,
};

export const SPACING = {
  zero: 0,
  hairline: 1,
  thick: 2,
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  section: 32,
  touch: 44,
  touchLg: 52,
  tabBar: 64,
  avatarSm: 36,
  avatarMd: 48,
  avatarLg: 72,
  scanCircle: 140,
} as const;

export const RADII = {
  none: 0,
  pill: 999,
} as const;

export const FONTS = {
  regular: "Termina-Regular",
  medium: "Termina-Medium",
  semibold: "Termina-SemiBold",
  bold: "Termina-Bold",
} as const;

export const TYPE = {
  micro: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.77,
  },
  xs: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  xsBold: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    lineHeight: 18,
  },
  sm: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  smMedium: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  smBold: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    lineHeight: 20,
  },
  input: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  item: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    lineHeight: 21,
  },
  figure: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    lineHeight: 23,
  },
  heading: {
    fontFamily: FONTS.bold,
    fontSize: 21,
    lineHeight: 26,
  },
  total: {
    fontFamily: FONTS.bold,
    fontSize: 26,
    lineHeight: 30,
  },
} as const;

export interface AppTheme {
  mode: ThemeMode;
  colors: AppColors;
  spacing: typeof SPACING;
  radii: typeof RADII;
  fonts: typeof FONTS;
  type: typeof TYPE;
  toggleTheme: () => void;
}

const STORAGE_KEY = "vm_admin_theme";

const ThemeContext = createContext<AppTheme | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(systemScheme === "dark" ? "dark" : "light");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "light" || stored === "dark") setMode(stored);
    });
  }, []);

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
      return next;
    });
  };

  const value = useMemo<AppTheme>(
    () => ({
      mode,
      colors: mode === "dark" ? DARK_COLORS : LIGHT_COLORS,
      spacing: SPACING,
      radii: RADII,
      fonts: FONTS,
      type: TYPE,
      toggleTheme,
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): AppTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used inside <AppThemeProvider>");
  return ctx;
}
