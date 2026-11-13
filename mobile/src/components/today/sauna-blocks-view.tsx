import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatDay } from "@/lib/admin/format";
import { formatHour } from "@/lib/sauna";
import { Card } from "@/mobile/src/components/primitives";
import { useTodayStyles } from "@/mobile/src/components/today/use-today-styles";
import { useReadyAdmin } from "@/mobile/src/store/admin-context";
import { useAppTheme, type AppTheme } from "@/mobile/src/theme/use-app-theme";

/** One card per sauna with its opening hours as a grid: tap a free hour to close it, a closed one to open it. */
export function SaunaBlocksView({ day }: { day: string }) {
  const theme = useAppTheme();
  const shared = useTodayStyles();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { data, toggleBlock } = useReadyAdmin();

  return (
    <View style={shared.section}>
      {data.saunas.map((sauna) => {
        const hours = Array.from({ length: Math.max(0, sauna.rates.closeHour - sauna.rates.openHour) }, (_, i) => sauna.rates.openHour + i);
        return (
          <Card key={sauna.id}>
            <Text style={shared.entryTime}>{sauna.name}</Text>
            <Text style={shared.entryCustomer}>Palieskite valandą, kad ją uždarytumėte arba atidarytumėte ({formatDay(day)}).</Text>
            <View style={styles.grid}>
              {hours.map((hour) => {
                const booked = data.bookings.some(
                  (b) =>
                    b.kind === "pirtis" &&
                    b.saunaId === sauna.id &&
                    b.date === day &&
                    b.status !== "atsaukta" &&
                    b.startHour !== undefined &&
                    b.hours !== undefined &&
                    hour >= b.startHour &&
                    hour < b.startHour + b.hours,
                );
                const closed = data.blocks.some((bl) => bl.saunaId === sauna.id && bl.date === day && bl.hour === hour);
                const light = booked || closed;
                return (
                  <Pressable
                    key={hour}
                    disabled={booked}
                    onPress={() => toggleBlock(sauna.id, day, hour)}
                    style={[styles.cell, booked ? styles.booked : closed ? styles.closed : styles.open]}
                  >
                    <Text style={light ? styles.textLight : styles.textDark}>{formatHour(hour)}</Text>
                    <Text style={light ? styles.subLight : styles.subDark}>{booked ? "Rezervuota" : closed ? "Uždaryta" : "Laisva"}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        );
      })}
    </View>
  );
}

function createStyles({ colors, spacing, type }: AppTheme) {
  return StyleSheet.create({
    grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs },
    cell: {
      minWidth: spacing.scanCircle / 2,
      minHeight: spacing.touch,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderWidth: spacing.hairline,
      alignItems: "center",
      justifyContent: "center",
    },
    open: { backgroundColor: colors.card, borderColor: colors.border },
    closed: { backgroundColor: colors.primary, borderColor: colors.primary },
    booked: { backgroundColor: colors.rust, borderColor: colors.rust },
    textDark: { ...type.xsBold, color: colors.foreground },
    textLight: { ...type.xsBold, color: colors.primaryForeground },
    subDark: { ...type.micro, color: colors.mutedForeground },
    subLight: { ...type.micro, color: colors.primaryForeground },
  });
}
