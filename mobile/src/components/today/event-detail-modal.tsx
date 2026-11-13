import React from "react";
import { Text, View } from "react-native";
import { formatDay, formatEur } from "@/lib/admin/format";
import type { ManagedEvent, TourTicket } from "@/lib/admin/types";
import { Card, SheetModal, StatusBadge } from "@/mobile/src/components/primitives";
import { useTodayStyles } from "@/mobile/src/components/today/use-today-styles";

export function EventDetailModal({
  event,
  tickets,
  onClose,
}: {
  event: ManagedEvent | null;
  tickets: TourTicket[];
  onClose: () => void;
}) {
  const styles = useTodayStyles();

  if (!event) return null;

  return (
    <SheetModal visible title={event.title} subtitle={`${formatDay(event.date)} · ${event.time} · ${event.place}`} onClose={onClose}>
      <Card>
        <Text style={styles.microLabel}>UŽIMTUMAS</Text>
        <Text style={styles.entryTime}>Parduota vietų: {event.capacity ? `${event.sold} / ${event.capacity}` : event.sold}</Text>
        {event.blurb ? <Text style={styles.entryCustomer}>{event.blurb}</Text> : null}
      </Card>

      <Text style={styles.microLabel}>DALYVIAI ({tickets.length})</Text>
      {tickets.length === 0 ? (
        <Text style={styles.entryCustomer}>Bilietų dar nėra.</Text>
      ) : (
        tickets.map((t) => (
          <Card key={t.id}>
            <View style={styles.rowBetween}>
              <View style={styles.entryBody}>
                <Text style={styles.entryTime}>
                  {t.customer.name} ({t.people} asm.)
                </Text>
                <Text style={styles.entryCustomer}>
                  {t.reference} · {t.customer.phone || t.customer.email} · {formatEur(t.total)}
                </Text>
              </View>
              <StatusBadge status={t.status} />
            </View>
          </Card>
        ))
      )}
    </SheetModal>
  );
}
