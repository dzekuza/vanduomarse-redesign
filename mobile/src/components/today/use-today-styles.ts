import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useAppTheme, type AppTheme } from "@/mobile/src/theme/use-app-theme";

/** Styles shared by every piece of the Today screen (entry rows, labels, action rows). */
function createStyles({ colors, spacing, type }: AppTheme) {
  return StyleSheet.create({
    section: { gap: spacing.md },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    rowBetween: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
    entryBody: { flex: 1, gap: spacing.xxs },
    microLabel: { ...type.micro, color: colors.rust, textTransform: "uppercase" },
    entryTime: { ...type.item, color: colors.foreground },
    entryCustomer: { ...type.xs, color: colors.mutedForeground },
    entryRef: { ...type.micro, color: colors.mutedForeground },
    actionRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs },
    contactRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, minHeight: spacing.touch },
    linkText: { ...type.smBold, color: colors.rust },
    totalFigure: { ...type.figure, color: colors.foreground, marginTop: spacing.xs },
    modalActions: { gap: spacing.sm },
    halfField: { flex: 1 },
  });
}

export function useTodayStyles() {
  const theme = useAppTheme();
  return useMemo(() => createStyles(theme), [theme]);
}
