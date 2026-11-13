import React from "react";
import { Text, View } from "react-native";
import { formatDay, formatEur, quadRentalLabel } from "@/lib/admin/format";
import type { QuadRental } from "@/lib/admin/types";
import { formatHour } from "@/lib/sauna";
import { Button, Card, PaymentStatusBadge, SheetModal, StatusBadge } from "@/mobile/src/components/primitives";
import { CustomerCard } from "@/mobile/src/components/today/customer-card";
import { useTodayStyles } from "@/mobile/src/components/today/use-today-styles";
import { useReadyAdmin } from "@/mobile/src/store/admin-context";

export function RentalDetailModal({
  rental,
  onClose,
  canEdit,
  onStatus,
  onCancel,
}: {
  rental: QuadRental | null;
  onClose: () => void;
  canEdit: boolean;
  onStatus: (id: string, status: QuadRental["status"]) => void;
  onCancel: (id: string, refund: boolean) => void;
}) {
  const styles = useTodayStyles();
  const { data } = useReadyAdmin();

  if (!rental) return null;
  const paidOnline = rental.payment?.status === "apmoketa" && rental.payment.refunded === 0;

  return (
    <SheetModal
      visible
      title={`Keturračiai · ${rental.reference}`}
      subtitle={`${formatDay(rental.date)} · ${formatHour(rental.startHour)}–${formatHour(rental.startHour + rental.hours)}`}
      onClose={onClose}
    >
      <View style={styles.chipRow}>
        <StatusBadge status={rental.status} />
        <PaymentStatusBadge payment={rental.payment} />
      </View>

      <CustomerCard customer={rental.customer} />

      <Card>
        <Text style={styles.microLabel}>KETURRAČIAI</Text>
        <Text style={styles.entryCustomer}>
          {quadRentalLabel(rental, data.quadTypes)} · Važiuotojai: {rental.riders}
        </Text>
        {rental.note ? <Text style={styles.entryCustomer}>Pastaba: {rental.note}</Text> : null}
        <Text style={styles.totalFigure}>Suma: {formatEur(rental.total)}</Text>
      </Card>

      {canEdit ? (
        <View style={styles.modalActions}>
          {rental.status === "laukia" ? (
            <Button label="Patvirtinti nuomą" variant="coral" onPress={() => onStatus(rental.id, "patvirtinta")} />
          ) : null}
          {rental.status === "patvirtinta" ? (
            <Button label="Pažymėti kaip įvykdytą" variant="primary" onPress={() => onStatus(rental.id, "ivykdyta")} />
          ) : null}
          {rental.status !== "atsaukta" ? (
            <>
              {paidOnline ? (
                <Button label="Atšaukti ir grąžinti pinigus (Stripe)" variant="destructive" onPress={() => onCancel(rental.id, true)} />
              ) : null}
              <Button label="Atšaukti nuomą" variant="outline" onPress={() => onCancel(rental.id, false)} />
            </>
          ) : null}
        </View>
      ) : null}
    </SheetModal>
  );
}
