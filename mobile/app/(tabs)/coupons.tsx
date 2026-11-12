import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mail, Ticket } from "lucide-react-native";
import {
  COUPON_SERVICE_LABEL,
  COUPON_STATUS_LABEL,
  formatCode,
  formatEuro,
  formatExpiry,
  normalizeCode,
  type CouponStatus,
} from "@/lib/coupons";
import { formatDay } from "@/lib/admin/format";
import type { Coupon } from "@/lib/admin/types";
import {
  Button,
  Card,
  Chip,
  CouponStatusBadge,
  EmptyState,
  Field,
  SheetModal,
} from "@/mobile/src/components/primitives";
import { useReadyAdmin } from "@/mobile/src/store/admin-context";
import { useAppTheme, type AppTheme } from "@/mobile/src/theme/use-app-theme";

type FilterOption = "visi" | CouponStatus;

const FILTER_OPTIONS: { id: FilterOption; label: string }[] = [
  { id: "visi", label: "Visi" },
  { id: "laukia_apmokejimo", label: COUPON_STATUS_LABEL.laukia_apmokejimo },
  { id: "aktyvus", label: COUPON_STATUS_LABEL.aktyvus },
  { id: "panaudotas", label: COUPON_STATUS_LABEL.panaudotas },
  { id: "atsauktas", label: COUPON_STATUS_LABEL.atsauktas },
];

export default function CouponsScreen() {
  const theme = useAppTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  const { data, refreshing, refresh, activateCoupon, redeemCoupon, cancelCoupon } = useReadyAdmin();

  const [filter, setFilter] = useState<FilterOption>("visi");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [redeemNote, setRedeemNote] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedCoupon = useMemo(
    () => data.coupons.find((c) => c.id === selectedId) ?? null,
    [data.coupons, selectedId],
  );

  const counts = useMemo(() => {
    const map: Record<FilterOption, number> = {
      visi: data.coupons.length,
      laukia_apmokejimo: 0,
      aktyvus: 0,
      panaudotas: 0,
      atsauktas: 0,
    };
    for (const c of data.coupons) {
      map[c.status] += 1;
    }
    return map;
  }, [data.coupons]);

  const filteredCoupons = useMemo(() => {
    const q = query.trim().toLowerCase();
    const normCode = normalizeCode(query);
    return data.coupons.filter((c) => {
      if (filter !== "visi" && c.status !== filter) return false;
      if (!q) return true;
      const matchesCode = Boolean(normCode && c.code && normalizeCode(c.code).includes(normCode));
      return (
        matchesCode ||
        c.reference.toLowerCase().includes(q) ||
        c.productName.toLowerCase().includes(q) ||
        c.buyer.name.toLowerCase().includes(q) ||
        c.buyer.email.toLowerCase().includes(q) ||
        c.recipientName.toLowerCase().includes(q) ||
        c.recipientEmail.toLowerCase().includes(q)
      );
    });
  }, [data.coupons, filter, query]);

  const openCoupon = (coupon: Coupon) => {
    setSelectedId(coupon.id);
    setRedeemAmount(String(coupon.balance));
    setRedeemNote("");
  };

  const handleActivate = async (coupon: Coupon) => {
    setBusy(true);
    const res = await activateCoupon(coupon.id);
    setBusy(false);
    if (res) {
      Alert.alert(
        "Kuponas aktyvuotas",
        `Kodas: ${formatCode(res.code)}\n${
          res.emailSent
            ? "El. laiškas su kodu išsiųstas pirkėjui."
            : "El. laiško išsiųsti nepavyko — perduokite kodą tiesiogiai."
        }`,
      );
    }
  };

  const handleRedeem = async (coupon: Coupon) => {
    const parsed = Number(redeemAmount.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      Alert.alert("Klaida", "Įveskite teisingą nuskaitomą sumą.");
      return;
    }
    if (parsed > coupon.balance) {
      Alert.alert("Klaida", `Suma negali viršyti likučio (${formatEuro(coupon.balance)}).`);
      return;
    }
    setBusy(true);
    const ok = await redeemCoupon(coupon.id, parsed, redeemNote);
    setBusy(false);
    if (ok) {
      setRedeemNote("");
      Alert.alert("Nuskaityta", `Nuo kupono nuskaityta ${formatEuro(parsed)}.`);
    }
  };

  const handleCancel = (coupon: Coupon) => {
    Alert.alert(
      "Atšaukti kuponą?",
      `Ar tikrai norite atšaukti kuponą ${coupon.code ? formatCode(coupon.code) : coupon.reference}?`,
      [
        { text: "Grįžti", style: "cancel" },
        {
          text: "Atšaukti kuponą",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            await cancelCoupon(coupon.id);
            setBusy(false);
            setSelectedId(null);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <Text style={s.title}>Dovanų kuponai</Text>
        <Text style={s.subtitle}>Patvirtinimas, kodo paieška ir likučio nuskaitymas</Text>
      </View>

      <View style={s.searchWrap}>
        <Field
          label="Paieška (kodas, KP- nr., pirkėjas arba gavėjas)"
          value={query}
          onChangeText={setQuery}
          placeholder="Pvz. AB12-CD34 arba Jonas"
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </View>

      <View style={s.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {FILTER_OPTIONS.map((opt) => (
            <Chip
              key={opt.id}
              label={`${opt.label} (${counts[opt.id]})`}
              active={filter === opt.id}
              onPress={() => setFilter(opt.id)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredCoupons}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.colors.rust}
          />
        }
        ListEmptyComponent={<EmptyState message="Kuponų pagal pasirinktą filtrą nerasta." />}
        renderItem={({ item }) => (
          <Pressable onPress={() => openCoupon(item)}>
            <Card style={s.card}>
              <View style={s.cardTop}>
                <View style={s.codeWrap}>
                  <Ticket size={theme.spacing.lg} color={theme.colors.rust} />
                  <Text style={s.codeText}>
                    {item.code ? formatCode(item.code) : item.reference}
                  </Text>
                </View>
                <CouponStatusBadge status={item.status} />
              </View>

              <Text style={s.productName}>{item.productName}</Text>
              <Text style={s.serviceLabel}>{COUPON_SERVICE_LABEL[item.service]}</Text>

              <View style={s.metaRow}>
                <View style={s.metaCol}>
                  <Text style={s.metaLabel}>PIRKĖJAS / GAVĖJAS</Text>
                  <Text style={s.metaValue}>
                    {item.buyer.name} → {item.recipientName || item.buyer.name}
                  </Text>
                </View>
                <View style={s.amountCol}>
                  <Text style={s.metaLabel}>LIKUTIS / VERTĖ</Text>
                  <Text style={s.balanceText}>
                    {formatEuro(item.balance)} / {formatEuro(item.faceValue)}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>
        )}
      />

      <SheetModal
        visible={Boolean(selectedCoupon)}
        onClose={() => setSelectedId(null)}
        title={
          selectedCoupon?.code
            ? formatCode(selectedCoupon.code)
            : selectedCoupon?.reference ?? "Kuponas"
        }
      >
        {selectedCoupon ? (
          <View style={s.sheetBody}>
            <View style={s.sheetStatusRow}>
              <CouponStatusBadge status={selectedCoupon.status} />
              <Text style={s.sheetRef}>{selectedCoupon.reference}</Text>
            </View>

            <Card style={s.summaryCard}>
              <Text style={s.productName}>{selectedCoupon.productName}</Text>
              <Text style={s.serviceLabel}>{COUPON_SERVICE_LABEL[selectedCoupon.service]}</Text>
              <View style={s.balanceRow}>
                <View>
                  <Text style={s.metaLabel}>LIKUTIS</Text>
                  <Text style={s.totalFigure}>{formatEuro(selectedCoupon.balance)}</Text>
                </View>
                <View>
                  <Text style={s.metaLabel}>PRADINĖ VERTĖ</Text>
                  <Text style={s.faceFigure}>{formatEuro(selectedCoupon.faceValue)}</Text>
                </View>
              </View>
              {selectedCoupon.expiresAt ? (
                <Text style={s.expiryText}>
                  Galioja iki: {formatExpiry(selectedCoupon.expiresAt)}
                </Text>
              ) : null}
            </Card>

            <View style={s.infoSection}>
              <Text style={s.sectionTitle}>PIRKĖJAS IR GAVĖJAS</Text>
              <Text style={s.infoLine}>Pirkėjas: {selectedCoupon.buyer.name}</Text>
              <Text style={s.infoSub}>{selectedCoupon.buyer.email}</Text>
              {selectedCoupon.recipientName ? (
                <Text style={s.infoLine}>Gavėjas: {selectedCoupon.recipientName}</Text>
              ) : null}
              {selectedCoupon.recipientEmail ? (
                <Text style={s.infoSub}>{selectedCoupon.recipientEmail}</Text>
              ) : null}
              {selectedCoupon.message ? (
                <Text style={s.messageBox}>„{selectedCoupon.message}“</Text>
              ) : null}

              <Button
                label="Rašyti pirkėjui el. paštu"
                variant="outline"
                icon={<Mail size={theme.spacing.lg} color={theme.colors.foreground} />}
                onPress={() => Linking.openURL(`mailto:${selectedCoupon.buyer.email}`)}
              />
            </View>

            {selectedCoupon.status === "laukia_apmokejimo" ? (
              <View style={s.actionSection}>
                <Text style={s.sectionTitle}>APMOKĖJIMO PATVIRTINIMAS</Text>
                <Button
                  label="Patvirtinti apmokėjimą ir išsiųsti kodą"
                  variant="primary"
                  loading={busy}
                  onPress={() => handleActivate(selectedCoupon)}
                />
                <Button
                  label="Atšaukti užsakymą"
                  variant="destructive"
                  disabled={busy}
                  onPress={() => handleCancel(selectedCoupon)}
                />
              </View>
            ) : null}

            {selectedCoupon.status === "aktyvus" && selectedCoupon.balance > 0 ? (
              <View style={s.actionSection}>
                <Text style={s.sectionTitle}>NUSKAITYTI NUO KUPONO</Text>
                <Field
                  label="Nuskaitoma suma (€)"
                  value={redeemAmount}
                  onChangeText={setRedeemAmount}
                  keyboardType="decimal-pad"
                  placeholder={String(selectedCoupon.balance)}
                />
                <Field
                  label="Pastaba (už ką panaudota)"
                  value={redeemNote}
                  onChangeText={setRedeemNote}
                  placeholder="Pvz. Pirtis arba plaukimas"
                />
                <Button
                  label="Nuskaityti sumą"
                  variant="primary"
                  loading={busy}
                  onPress={() => handleRedeem(selectedCoupon)}
                />
                <Button
                  label="Atšaukti kuponą"
                  variant="destructive"
                  disabled={busy}
                  onPress={() => handleCancel(selectedCoupon)}
                />
              </View>
            ) : null}

            {selectedCoupon.redemptions.length > 0 ? (
              <View style={s.infoSection}>
                <Text style={s.sectionTitle}>PANAUDOJIMO ISTORIJA</Text>
                {selectedCoupon.redemptions.map((r) => (
                  <View key={r.id} style={s.redemptionRow}>
                    <View style={s.redemptionLeft}>
                      <Text style={s.redemptionAmount}>−{formatEuro(r.amount)}</Text>
                      {r.note ? <Text style={s.redemptionNote}>{r.note}</Text> : null}
                    </View>
                    <Text style={s.redemptionDate}>{formatDay(r.at.slice(0, 10))}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </SheetModal>
    </SafeAreaView>
  );
}

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      gap: theme.spacing.xxs,
    },
    title: {
      ...theme.type.heading,
      color: theme.colors.foreground,
    },
    subtitle: {
      ...theme.type.xs,
      color: theme.colors.mutedForeground,
    },
    searchWrap: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.sm,
    },
    filterBar: {
      borderBottomWidth: theme.spacing.hairline,
      borderBottomColor: theme.colors.border,
    },
    filterRow: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    listContent: {
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    card: {
      gap: theme.spacing.sm,
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing.sm,
    },
    codeWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    codeText: {
      ...theme.type.smBold,
      color: theme.colors.foreground,
    },
    productName: {
      ...theme.type.item,
      color: theme.colors.foreground,
    },
    serviceLabel: {
      ...theme.type.xs,
      color: theme.colors.mutedForeground,
    },
    metaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      paddingTop: theme.spacing.xs,
      borderTopWidth: theme.spacing.hairline,
      borderTopColor: theme.colors.border,
      gap: theme.spacing.md,
    },
    metaCol: {
      flex: 1,
      gap: theme.spacing.xxs,
    },
    amountCol: {
      alignItems: "flex-end",
      gap: theme.spacing.xxs,
    },
    metaLabel: {
      ...theme.type.micro,
      color: theme.colors.mutedForeground,
      textTransform: "uppercase",
    },
    metaValue: {
      ...theme.type.xsBold,
      color: theme.colors.foreground,
    },
    balanceText: {
      ...theme.type.smBold,
      color: theme.colors.rust,
    },
    sheetBody: {
      gap: theme.spacing.lg,
    },
    sheetStatusRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sheetRef: {
      ...theme.type.xsBold,
      color: theme.colors.mutedForeground,
    },
    summaryCard: {
      gap: theme.spacing.sm,
    },
    balanceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: theme.spacing.sm,
      borderTopWidth: theme.spacing.hairline,
      borderTopColor: theme.colors.border,
    },
    totalFigure: {
      ...theme.type.total,
      color: theme.colors.rust,
    },
    faceFigure: {
      ...theme.type.figure,
      color: theme.colors.foreground,
    },
    expiryText: {
      ...theme.type.xs,
      color: theme.colors.mutedForeground,
    },
    infoSection: {
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.sm,
      borderTopWidth: theme.spacing.hairline,
      borderTopColor: theme.colors.border,
    },
    actionSection: {
      gap: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      borderTopWidth: theme.spacing.hairline,
      borderTopColor: theme.colors.border,
    },
    sectionTitle: {
      ...theme.type.micro,
      color: theme.colors.mutedForeground,
      textTransform: "uppercase",
    },
    infoLine: {
      ...theme.type.smBold,
      color: theme.colors.foreground,
    },
    infoSub: {
      ...theme.type.xs,
      color: theme.colors.mutedForeground,
    },
    messageBox: {
      ...theme.type.sm,
      color: theme.colors.foreground,
      backgroundColor: theme.colors.muted,
      padding: theme.spacing.md,
    },
    redemptionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: theme.spacing.xs,
      borderBottomWidth: theme.spacing.hairline,
      borderBottomColor: theme.colors.border,
    },
    redemptionLeft: {
      flex: 1,
      gap: theme.spacing.xxs,
    },
    redemptionAmount: {
      ...theme.type.smBold,
      color: theme.colors.foreground,
    },
    redemptionNote: {
      ...theme.type.xs,
      color: theme.colors.mutedForeground,
    },
    redemptionDate: {
      ...theme.type.xs,
      color: theme.colors.mutedForeground,
    },
  });
