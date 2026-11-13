import React from "react";
import { Text, View } from "react-native";
import { Check } from "lucide-react-native";
import { bookingTypeLabel, bookingWhen, formatDay, formatEur } from "@/lib/admin/format";
import type { Booking, QuadRental } from "@/lib/admin/types";
import { formatHour } from "@/lib/sauna";
import { Button, Card, EmptyState, PaymentStatusBadge } from "@/mobile/src/components/primitives";
import { usePendingRequests } from "@/mobile/src/components/today/use-pending-requests";
import { useTodayStyles } from "@/mobile/src/components/today/use-today-styles";
import { useReadyAdmin } from "@/mobile/src/store/admin-context";
import { useAppTheme } from "@/mobile/src/theme/use-app-theme";

/** Requests waiting for staff: bookings, quad rentals and tickets, each with a quick confirm. */
export function PendingView({
  pending,
  canBook,
  canQuads,
  canEvents,
  onOpenBooking,
  onOpenRental,
}: {
  pending: ReturnType<typeof usePendingRequests>;
  canBook: boolean;
  canQuads: boolean;
  canEvents: boolean;
  onOpenBooking: (booking: Booking) => void;
  onOpenRental: (rental: QuadRental) => void;
}) {
  const theme = useAppTheme();
  const styles = useTodayStyles();
  const { data, setBookingStatus, setRentalStatus, setTourTicketStatus, cancelRequest } = useReadyAdmin();

  if (pending.total === 0) {
    return (
      <View style={styles.section}>
        <EmptyState
          icon={<Check size={24} color={theme.colors.statusOk} />}
          title="Visos užklausos peržiūrėtos"
          subtitle="Naujų nepatvirtintų rezervacijų šiuo metu nėra."
        />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {pending.bookings.map((b) => (
        <Card key={b.id} onPress={() => onOpenBooking(b)}>
          <View style={styles.rowBetween}>
            <View style={styles.entryBody}>
              <Text style={styles.microLabel}>
                {bookingTypeLabel(b, data.stayTypes)} · {b.reference}
              </Text>
              <Text style={styles.entryTime}>{b.customer.name}</Text>
              <Text style={styles.entryCustomer}>
                {formatDay(b.date)} · {bookingWhen(b)} · {formatEur(b.total)}
              </Text>
            </View>
            <PaymentStatusBadge payment={b.payment} />
          </View>
          {canBook ? (
            <View style={styles.actionRow}>
              <Button
                label="Patvirtinti"
                variant="coral"
                small
                icon={<Check size={16} color={theme.colors.onRust} />}
                onPress={() => setBookingStatus(b.id, "patvirtinta")}
              />
              <Button label="Atidaryti" variant="outline" small onPress={() => onOpenBooking(b)} />
            </View>
          ) : null}
        </Card>
      ))}

      {pending.rentals.map((r) => (
        <Card key={r.id} onPress={() => onOpenRental(r)}>
          <View style={styles.rowBetween}>
            <View style={styles.entryBody}>
              <Text style={styles.microLabel}>Keturračiai · {r.reference}</Text>
              <Text style={styles.entryTime}>{r.customer.name}</Text>
              <Text style={styles.entryCustomer}>
                {formatDay(r.date)} · {formatHour(r.startHour)}–{formatHour(r.startHour + r.hours)} · {formatEur(r.total)}
              </Text>
            </View>
            <PaymentStatusBadge payment={r.payment} />
          </View>
          {canQuads ? (
            <View style={styles.actionRow}>
              <Button
                label="Patvirtinti"
                variant="coral"
                small
                icon={<Check size={16} color={theme.colors.onRust} />}
                onPress={() => setRentalStatus(r.id, "patvirtinta")}
              />
              <Button label="Atidaryti" variant="outline" small onPress={() => onOpenRental(r)} />
            </View>
          ) : null}
        </Card>
      ))}

      {pending.tickets.map((t) => (
        <Card key={t.id}>
          <View style={styles.rowBetween}>
            <View style={styles.entryBody}>
              <Text style={styles.microLabel}>Bilietai · {t.reference}</Text>
              <Text style={styles.entryTime}>{t.customer.name}</Text>
              <Text style={styles.entryCustomer}>
                {t.eventTitle} · {formatDay(t.eventDate)} {t.eventTime} · {t.people} asm. · {formatEur(t.total)}
              </Text>
            </View>
            <PaymentStatusBadge payment={t.payment} />
          </View>
          {canQuads || canEvents ? (
            <View style={styles.actionRow}>
              <Button label="Patvirtinti" variant="coral" small onPress={() => setTourTicketStatus(t.id, "patvirtinta")} />
              <Button label="Atšaukti" variant="outline" small onPress={() => cancelRequest("ticket", t.id, false)} />
            </View>
          ) : null}
        </Card>
      ))}
    </View>
  );
}
