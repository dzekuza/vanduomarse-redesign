import React from "react";
import { Text, View } from "react-native";
import { bookingTypeLabel, bookingWhen, formatDay, formatEur } from "@/lib/admin/format";
import { BOOKING_SOURCE } from "@/lib/admin/labels";
import type { Booking } from "@/lib/admin/types";
import { Button, Card, PaymentStatusBadge, SheetModal, StatusBadge } from "@/mobile/src/components/primitives";
import { CustomerCard } from "@/mobile/src/components/today/customer-card";
import { useTodayStyles } from "@/mobile/src/components/today/use-today-styles";
import { useReadyAdmin } from "@/mobile/src/store/admin-context";

export function BookingDetailModal({
  booking,
  onClose,
  canEdit,
  onStatus,
  onCancel,
}: {
  booking: Booking | null;
  onClose: () => void;
  canEdit: boolean;
  onStatus: (id: string, status: Booking["status"]) => void;
  onCancel: (id: string, refund: boolean) => void;
}) {
  const styles = useTodayStyles();
  const { data } = useReadyAdmin();

  if (!booking) return null;
  const paidOnline = booking.payment?.status === "apmoketa" && booking.payment.refunded === 0;

  return (
    <SheetModal
      visible
      title={`${bookingTypeLabel(booking, data.stayTypes)} · ${booking.reference}`}
      subtitle={`${formatDay(booking.date)} · ${bookingWhen(booking)}`}
      onClose={onClose}
    >
      <View style={styles.chipRow}>
        <StatusBadge status={booking.status} />
        <PaymentStatusBadge payment={booking.payment} />
      </View>

      <CustomerCard customer={booking.customer} />

      <Card>
        <Text style={styles.microLabel}>INFORMACIJA</Text>
        <Text style={styles.entryCustomer}>
          Svečiai: {booking.guests ?? "Nenurodyta"} · Šaltinis: {booking.source ? BOOKING_SOURCE[booking.source] : "Svetainė"}
        </Text>
        {booking.extras.length > 0 ? <Text style={styles.entryCustomer}>Priedai: {booking.extras.join(", ")}</Text> : null}
        {booking.note ? <Text style={styles.entryCustomer}>Pastaba: {booking.note}</Text> : null}
        <Text style={styles.totalFigure}>Suma: {formatEur(booking.total)}</Text>
      </Card>

      {canEdit ? (
        <View style={styles.modalActions}>
          {booking.status === "laukia" ? (
            <Button label="Patvirtinti rezervaciją" variant="coral" onPress={() => onStatus(booking.id, "patvirtinta")} />
          ) : null}
          {booking.status === "patvirtinta" ? (
            <Button label="Pažymėti kaip įvykdytą" variant="primary" onPress={() => onStatus(booking.id, "ivykdyta")} />
          ) : null}
          {booking.status !== "atsaukta" ? (
            <>
              {paidOnline ? (
                <Button label="Atšaukti ir grąžinti pinigus (Stripe)" variant="destructive" onPress={() => onCancel(booking.id, true)} />
              ) : null}
              <Button
                label={paidOnline ? "Atšaukti be grąžinimo" : "Atšaukti rezervaciją"}
                variant="outline"
                onPress={() => onCancel(booking.id, false)}
              />
            </>
          ) : null}
        </View>
      ) : null}
    </SheetModal>
  );
}
