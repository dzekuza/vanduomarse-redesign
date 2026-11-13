import React from "react";
import { Linking, Pressable, Text } from "react-native";
import { Phone } from "lucide-react-native";
import type { Customer } from "@/lib/admin/types";
import { Card } from "@/mobile/src/components/primitives";
import { useTodayStyles } from "@/mobile/src/components/today/use-today-styles";
import { useAppTheme } from "@/mobile/src/theme/use-app-theme";

/** Name, tap-to-call phone and e-mail of the person who made a request. */
export function CustomerCard({ customer }: { customer: Customer }) {
  const theme = useAppTheme();
  const styles = useTodayStyles();
  return (
    <Card>
      <Text style={styles.microLabel}>KLIENTAS</Text>
      <Text style={styles.entryTime}>{customer.name}</Text>
      {customer.phone ? (
        <Pressable onPress={() => Linking.openURL(`tel:${customer.phone}`)} style={styles.contactRow}>
          <Phone size={16} color={theme.colors.rust} />
          <Text style={styles.linkText}>{customer.phone}</Text>
        </Pressable>
      ) : null}
      {customer.email ? <Text style={styles.entryCustomer}>{customer.email}</Text> : null}
    </Card>
  );
}
