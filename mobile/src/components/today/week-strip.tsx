import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { weekDays } from "@/lib/admin/calendar-entries";
import { formatDay, parseDay } from "@/lib/admin/format";
import { dateKey } from "@/lib/sauna";
import { Card } from "@/mobile/src/components/primitives";
import { useAppTheme, type AppTheme } from "@/mobile/src/theme/use-app-theme";

/** Week header (previous / next, jump to today) and a strip of day tiles with their entry counts. */
export function WeekStrip({
  selectedDay,
  today,
  onSelect,
  countOn,
}: {
  selectedDay: string;
  today: string;
  onSelect: (day: string) => void;
  countOn: (day: string) => number;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const week = useMemo(() => weekDays(selectedDay), [selectedDay]);

  const shiftWeek = (dir: -1 | 1) => {
    const d = parseDay(selectedDay);
    d.setDate(d.getDate() + dir * 7);
    onSelect(dateKey(d));
  };

  return (
    <Card>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Ankstesnė savaitė" onPress={() => shiftWeek(-1)} style={styles.iconBtn}>
          <ChevronLeft size={20} color={theme.colors.foreground} />
        </Pressable>
        <Pressable onPress={() => onSelect(today)}>
          <Text style={styles.title}>{formatDay(selectedDay)}</Text>
          {selectedDay !== today ? <Text style={styles.todayJump}>Grįžti į šiandieną</Text> : null}
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Kita savaitė" onPress={() => shiftWeek(1)} style={styles.iconBtn}>
          <ChevronRight size={20} color={theme.colors.foreground} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {week.map((day) => {
          const active = day === selectedDay;
          const count = countOn(day);
          return (
            <Pressable
              key={day}
              accessibilityRole="button"
              onPress={() => onSelect(day)}
              style={[styles.tile, active ? styles.tileActive : styles.tileInactive]}
            >
              <Text style={active ? styles.labelActive : styles.labelInactive}>{formatDay(day).split(",")[0]}</Text>
              <Text style={active ? styles.numActive : styles.numInactive}>{day.slice(8, 10)}</Text>
              <Text style={active ? styles.countActive : styles.countInactive}>{count > 0 ? `${count} įr.` : "—"}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </Card>
  );
}

function createStyles({ colors, spacing, type }: AppTheme) {
  return StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xs },
    title: { ...type.item, color: colors.foreground, textAlign: "center" },
    todayJump: { ...type.micro, color: colors.rust, textAlign: "center", textTransform: "uppercase" },
    iconBtn: {
      width: spacing.touch,
      height: spacing.touch,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: spacing.hairline,
      borderColor: colors.border,
    },
    strip: { gap: spacing.xs },
    tile: {
      width: spacing.touchLg,
      minHeight: spacing.tabBar,
      paddingVertical: spacing.xs,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: spacing.hairline,
      gap: spacing.xxs,
    },
    tileActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    tileInactive: { backgroundColor: colors.card, borderColor: colors.border },
    labelActive: { ...type.micro, color: colors.primaryForeground },
    labelInactive: { ...type.micro, color: colors.mutedForeground },
    numActive: { ...type.item, color: colors.primaryForeground },
    numInactive: { ...type.item, color: colors.foreground },
    countActive: { ...type.xs, color: colors.primaryForeground },
    countInactive: { ...type.xs, color: colors.mutedForeground },
  });
}
