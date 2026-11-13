import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Calendar as CalendarIcon } from "lucide-react-native";
import { CALENDAR_KINDS, seatsLabel, type CalendarEntry, type CalendarKind } from "@/lib/admin/calendar-entries";
import { Card, Chip, EmptyState, StatusBadge } from "@/mobile/src/components/primitives";
import { useTodayStyles } from "@/mobile/src/components/today/use-today-styles";
import { useAppTheme, type AppTheme } from "@/mobile/src/theme/use-app-theme";

/** The selected day's entries with a kind filter chip row. The parent filters the entries; this only shows them. */
export function AgendaView({
  entries,
  kindFilter,
  onKindFilter,
  onOpen,
}: {
  entries: CalendarEntry[];
  kindFilter: CalendarKind | "visos";
  onKindFilter: (kind: CalendarKind | "visos") => void;
  onOpen: (entry: CalendarEntry) => void;
}) {
  const theme = useAppTheme();
  const shared = useTodayStyles();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={shared.section}>
      <View style={shared.chipRow}>
        <Chip label="Visi" active={kindFilter === "visos"} onPress={() => onKindFilter("visos")} />
        {CALENDAR_KINDS.map((k) => (
          <Chip key={k.id} label={k.label} active={kindFilter === k.id} onPress={() => onKindFilter(k.id)} />
        ))}
      </View>

      {entries.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon size={24} color={theme.colors.mutedForeground} />}
          title="Šią dieną įrašų nėra"
          subtitle="Pasirinkite kitą dieną arba sukurkite naują rezervaciją."
        />
      ) : (
        entries.map((entry) => (
          <Card key={entry.key} onPress={() => onOpen(entry)}>
            <View style={shared.rowBetween}>
              <View style={styles.rowLeft}>
                <View style={[styles.kindBar, styles[entry.kind]]} />
                <View style={shared.entryBody}>
                  <Text style={shared.entryTime}>
                    {entry.time || "Visa diena"} · {entry.title}
                  </Text>
                  <Text style={shared.entryCustomer}>
                    {entry.event ? `${entry.detail} · Užimta: ${seatsLabel(entry.event)}` : `${entry.customer.name} · ${entry.detail}`}
                  </Text>
                  {entry.reference ? <Text style={shared.entryRef}>{entry.reference}</Text> : null}
                </View>
              </View>
              {!entry.event ? <StatusBadge status={entry.status} /> : null}
            </View>
          </Card>
        ))
      )}
    </View>
  );
}

function createStyles({ colors, spacing }: AppTheme) {
  return StyleSheet.create({
    rowLeft: { flex: 1, flexDirection: "row", gap: spacing.sm },
    kindBar: { width: spacing.xxs, alignSelf: "stretch" },
    pirtis: { backgroundColor: colors.rust },
    namelis: { backgroundColor: colors.lakeSoft },
    keturraciai: { backgroundColor: colors.calendarBrown },
    // Events (and any kind added later) share the pink bar.
    renginys: { backgroundColor: colors.calendarPink },
  });
}
