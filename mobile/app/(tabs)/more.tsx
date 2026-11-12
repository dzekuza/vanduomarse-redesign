import React, { useEffect, useMemo, useState } from "react";
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
import {
  Bell,
  CreditCard,
  FileText,
  LogOut,
  Mail,
  Moon,
  Phone,
  Sun,
  UserCheck,
} from "lucide-react-native";
import { formatEuro } from "@/lib/coupons";
import { formatDay } from "@/lib/admin/format";
import { hasPermission } from "@/lib/admin/permissions";
import type { Rider } from "@/lib/admin/types";
import {
  NOTIFICATION_TOPICS,
  type NotificationTopic,
} from "@/lib/notification-topics";
import {
  getSignedStorageUrl,
  searchRidersMobile,
} from "@/mobile/src/lib/admin-api";
import {
  loadMyPushRegistration,
  saveMyPushRegistration,
} from "@/mobile/src/lib/push-notifications";
import { supabase } from "@/mobile/src/lib/supabase";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  SheetModal,
} from "@/mobile/src/components/primitives";
import { UsbScanTarget } from "@/mobile/src/components/usb-scan-target";
import { useReadyAdmin } from "@/mobile/src/store/admin-context";
import { useAppTheme, type AppTheme } from "@/mobile/src/theme/use-app-theme";

type SubView = "klientai" | "apzvalga" | "paskyra";

interface SaleRow {
  id: string;
  title: string;
  category: string;
  customer: string;
  amount: number;
  date: string;
}

export default function MoreScreen() {
  const theme = useAppTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  const {
    access,
    data,
    refreshing,
    refresh,
    signOut,
    bindRiderCard,
    addRiderComment,
  } = useReadyAdmin();

  const canSeeClients =
    hasPermission(access, "klientai") || hasPermission(access, "apyrankes");
  const canSeeOverview = hasPermission(access, "apzvalga");

  const defaultTab: SubView = canSeeClients
    ? "klientai"
    : canSeeOverview
      ? "apzvalga"
      : "paskyra";

  const [subView, setSubView] = useState<SubView>(defaultTab);

  // --- Klientai state ---
  const [riderQuery, setRiderQuery] = useState("");
  const [searchedRiders, setSearchedRiders] = useState<Rider[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [rebindOpen, setRebindOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);

  // --- Paskyra state ---
  const [pushActive, setPushActive] = useState(false);
  const [pushTopics, setPushTopics] = useState<NotificationTopic[]>(["visi"]);
  const [pushSaving, setPushSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);

  useEffect(() => {
    const q = riderQuery.trim();
    if (!q) {
      setSearchedRiders(null);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      searchRidersMobile(q, 40)
        .then((rows) => {
          if (!cancelled) setSearchedRiders(rows);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [riderQuery]);

  useEffect(() => {
    loadMyPushRegistration(access.userId).then((reg) => {
      if (reg) {
        setPushActive(reg.active);
        setPushTopics(reg.topics.length ? reg.topics : ["visi"]);
      }
    });
  }, [access.userId]);

  const displayedRiders = useMemo(
    () => searchedRiders ?? data.riders.slice(0, 40),
    [searchedRiders, data.riders],
  );

  const planById = useMemo(
    () => new Map(data.ridePlans.map((p) => [p.id, p])),
    [data.ridePlans],
  );

  const cardByRiderId = useMemo(
    () => new Map(data.riderCards.map((c) => [c.riderId, c.cardNumber])),
    [data.riderCards],
  );

  const salesSummary = useMemo(() => {
    const rows: SaleRow[] = [];

    for (const b of data.bookings) {
      if (b.status === "atsaukta") continue;
      rows.push({
        id: `b-${b.id}`,
        title: b.reference,
        category: b.kind === "pirtis" ? "Pirtis" : "Nakvynė",
        customer: b.customer.name,
        amount: b.total,
        date: b.createdAt.slice(0, 10),
      });
    }

    for (const r of data.quadRentals) {
      if (r.status === "atsaukta") continue;
      rows.push({
        id: `q-${r.id}`,
        title: r.reference,
        category: "Keturračiai",
        customer: r.customer.name,
        amount: r.total,
        date: r.createdAt.slice(0, 10),
      });
    }

    for (const t of [...data.tourTickets, ...data.eventTickets]) {
      if (t.status === "atsaukta") continue;
      rows.push({
        id: `t-${t.id}`,
        title: t.eventTitle,
        category: "Renginiai ir žygiai",
        customer: t.customer.name,
        amount: t.total,
        date: t.createdAt.slice(0, 10),
      });
    }

    for (const p of data.purchases) {
      if (!p.price || p.price <= 0) continue;
      const rider = data.riders.find((r) => r.id === p.riderId);
      rows.push({
        id: `p-${p.id}`,
        title: p.planName,
        category: "Plaukimas / apyrankės",
        customer: rider ? `${rider.name} ${rider.surname}` : "Klientas",
        amount: p.price,
        date: p.soldAt.slice(0, 10),
      });
    }

    for (const c of data.coupons) {
      if (c.status === "laukia_apmokejimo" || c.status === "atsauktas") continue;
      rows.push({
        id: `c-${c.id}`,
        title: c.productName,
        category: "Kuponai",
        customer: c.buyer.name,
        amount: c.faceValue,
        date: (c.paidAt ?? c.createdAt).slice(0, 10),
      });
    }

    rows.sort((a, b) => b.date.localeCompare(a.date));
    const totalRevenue = rows.reduce((sum, r) => sum + r.amount, 0);
    const count = rows.length;
    const average = count > 0 ? Math.round(totalRevenue / count) : 0;

    return {
      totalRevenue,
      count,
      average,
      recent: rows.slice(0, 40),
    };
  }, [
    data.bookings,
    data.quadRentals,
    data.tourTickets,
    data.eventTickets,
    data.purchases,
    data.coupons,
    data.riders,
  ]);

  const handleOpenStorageFile = async (
    bucket: "rider-photos" | "rider-documents" | "rider-waivers",
    path: string | null,
  ) => {
    if (!path) return;
    const url = await getSignedStorageUrl(bucket, path);
    if (!url) {
      Alert.alert("Klaida", "Nepavyko sugeneruoti failo nuorodos.");
      return;
    }
    await Linking.openURL(url);
  };

  const handleBindCard = async (cardNumber: string) => {
    if (!selectedRider) return;
    const res = await bindRiderCard(cardNumber, selectedRider.id);
    if (res) {
      setRebindOpen(false);
      Alert.alert(
        "Apyrankė priskirta",
        res.replacedName
          ? `Apyrankė #${cardNumber} perkelta iš ${res.replacedName}.`
          : `Apyrankė #${cardNumber} priskirta klientui ${selectedRider.name} ${selectedRider.surname}.`,
      );
    }
  };

  const handleAddComment = async () => {
    if (!selectedRider || !commentText.trim()) return;
    setCommentBusy(true);
    const ok = await addRiderComment(selectedRider.id, commentText);
    setCommentBusy(false);
    if (ok) setCommentText("");
  };

  const toggleTopic = (topic: NotificationTopic) => {
    if (topic === "visi") {
      setPushTopics(["visi"]);
      return;
    }
    setPushTopics((prev) => {
      const withoutAll = prev.filter((t) => t !== "visi");
      const exists = withoutAll.includes(topic);
      const next = exists
        ? withoutAll.filter((t) => t !== topic)
        : [...withoutAll, topic];
      return next.length > 0 ? next : ["visi"];
    });
  };

  const handleSavePush = async (nextActive: boolean) => {
    setPushSaving(true);
    const res = await saveMyPushRegistration(access.userId, pushTopics, nextActive);
    setPushSaving(false);
    if (!res.ok) {
      Alert.alert("Push pranešimai", res.message);
      return;
    }
    setPushActive(nextActive);
    Alert.alert(
      "Išsaugota",
      nextActive
        ? "Push pranešimai šiame įrenginyje įjungti."
        : "Push pranešimai šiame įrenginyje išjungti.",
    );
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 8 || newPassword.length > 72) {
      Alert.alert("Klaida", "Slaptažodis turi būti nuo 8 iki 72 simbolių.");
      return;
    }
    setPasswordBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordBusy(false);
    if (error) {
      Alert.alert("Klaida", "Nepavyko pakeisti slaptažodžio.");
      return;
    }
    setNewPassword("");
    Alert.alert("Pakeista", "Slaptažodis sėkmingai atnaujintas.");
  };

  const riderComments = useMemo(
    () =>
      selectedRider
        ? data.riderComments.filter((c) => c.riderId === selectedRider.id)
        : [],
    [data.riderComments, selectedRider],
  );

  const riderPurchases = useMemo(
    () =>
      selectedRider
        ? data.purchases.filter((p) => p.riderId === selectedRider.id)
        : [],
    [data.purchases, selectedRider],
  );

  const riderDocuments = useMemo(
    () =>
      selectedRider
        ? data.riderDocuments.filter((d) => d.riderId === selectedRider.id)
        : [],
    [data.riderDocuments, selectedRider],
  );

  const riderWaivers = useMemo(
    () =>
      selectedRider
        ? data.riderWaivers.filter((w) => w.riderId === selectedRider.id)
        : [],
    [data.riderWaivers, selectedRider],
  );

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <Text style={s.title}>Daugiau</Text>
        <View style={s.subTabRow}>
          {canSeeClients ? (
            <Chip
              label="Klientai"
              active={subView === "klientai"}
              onPress={() => setSubView("klientai")}
            />
          ) : null}
          {canSeeOverview ? (
            <Chip
              label="Apžvalga"
              active={subView === "apzvalga"}
              onPress={() => setSubView("apzvalga")}
            />
          ) : null}
          <Chip
            label="Paskyra"
            active={subView === "paskyra"}
            onPress={() => setSubView("paskyra")}
          />
        </View>
      </View>

      {subView === "klientai" && canSeeClients ? (
        <View style={s.flex}>
          <View style={s.searchBox}>
            <Field
              label="Paieška per visus klientus (vardas, pavardė, tel., el. paštas)"
              value={riderQuery}
              onChangeText={setRiderQuery}
              placeholder="Pvz. Mantas arba +3706..."
              autoCorrect={false}
            />
          </View>

          <FlatList
            data={displayedRiders}
            keyExtractor={(item) => item.id}
            contentContainerStyle={s.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing || searching}
                onRefresh={refresh}
                tintColor={theme.colors.rust}
              />
            }
            ListEmptyComponent={
              <EmptyState
                message={
                  searching ? "Ieškoma klientų..." : "Klientų pagal paiešką nerasta."
                }
              />
            }
            renderItem={({ item }) => {
              const plan = item.planId ? planById.get(item.planId) : null;
              const card = cardByRiderId.get(item.id);
              return (
                <Pressable onPress={() => setSelectedRider(item)}>
                  <Card style={s.clientCard}>
                    <View style={s.clientTop}>
                      <Text style={s.clientName}>
                        {item.name} {item.surname}
                      </Text>
                      {card ? (
                        <Text style={s.cardBadge}>#{card}</Text>
                      ) : null}
                    </View>
                    <Text style={s.clientPlan}>
                      {plan ? `${plan.name} (${plan.category})` : "Planas nepriskirtas"}
                    </Text>
                    {item.phone || item.email ? (
                      <Text style={s.clientMeta}>
                        {[item.phone, item.email].filter(Boolean).join(" · ")}
                      </Text>
                    ) : null}
                  </Card>
                </Pressable>
              );
            }}
          />
        </View>
      ) : null}

      {subView === "apzvalga" && canSeeOverview ? (
        <ScrollView
          contentContainerStyle={s.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={theme.colors.rust}
            />
          }
        >
          <View style={s.kpiGrid}>
            <Card style={s.kpiCard}>
              <Text style={s.kpiLabel}>PAJAMOS</Text>
              <Text style={s.kpiTotal}>{formatEuro(salesSummary.totalRevenue)}</Text>
            </Card>
            <Card style={s.kpiCard}>
              <Text style={s.kpiLabel}>PARDAVIMAI</Text>
              <Text style={s.kpiFigure}>{salesSummary.count}</Text>
            </Card>
            <Card style={s.kpiCard}>
              <Text style={s.kpiLabel}>VID. SUMA</Text>
              <Text style={s.kpiFigure}>{formatEuro(salesSummary.average)}</Text>
            </Card>
          </View>

          <Text style={s.sectionHeader}>NAUJAUSI PARDAVIMAI</Text>
          {salesSummary.recent.map((row) => (
            <Card key={row.id} style={s.saleCard}>
              <View style={s.saleTop}>
                <Text style={s.saleTitle}>{row.title}</Text>
                <Text style={s.saleAmount}>{formatEuro(row.amount)}</Text>
              </View>
              <View style={s.saleBottom}>
                <Text style={s.saleSub}>
                  {row.category} · {row.customer}
                </Text>
                <Text style={s.saleSub}>{formatDay(row.date)}</Text>
              </View>
            </Card>
          ))}
        </ScrollView>
      ) : null}

      {subView === "paskyra" ? (
        <ScrollView contentContainerStyle={s.listContent}>
          <Card style={s.sectionCard}>
            <View style={s.profileHeader}>
              <UserCheck size={theme.spacing.xl} color={theme.colors.rust} />
              <View style={s.flex}>
                <Text style={s.clientName}>{access.name}</Text>
                <Text style={s.clientMeta}>{access.email}</Text>
              </View>
            </View>
            <Text style={s.roleBadge}>
              Rolė: {access.roleName} {access.isOwner ? "(Savininkas)" : ""}
            </Text>
          </Card>

          <Card style={s.sectionCard}>
            <Text style={s.sectionHeader}>EKRANO TEMA</Text>
            <Button
              label={
                theme.mode === "dark"
                  ? "Perjungti į šviesią temą"
                  : "Perjungti į tamsią temą"
              }
              variant="secondary"
              icon={
                theme.mode === "dark" ? (
                  <Sun size={theme.spacing.lg} color={theme.colors.secondaryForeground} />
                ) : (
                  <Moon size={theme.spacing.lg} color={theme.colors.secondaryForeground} />
                )
              }
              onPress={theme.toggleTheme}
            />
          </Card>

          <Card style={s.sectionCard}>
            <View style={s.profileHeader}>
              <Bell size={theme.spacing.lg} color={theme.colors.rust} />
              <Text style={s.sectionHeader}>PUSH PRANEŠIMAI ŠIAME ĮRENGINYJE</Text>
            </View>
            <Text style={s.clientMeta}>
              Pasirinkite temas, apie kurias norite gauti momentinius pranešimus į šį
              iPhone / iPad.
            </Text>
            <View style={s.topicRow}>
              {NOTIFICATION_TOPICS.map((t) => (
                <Chip
                  key={t.id}
                  label={t.label}
                  active={pushTopics.includes(t.id)}
                  onPress={() => toggleTopic(t.id)}
                />
              ))}
            </View>
            <Button
              label={
                pushActive
                  ? "Atnaujinti / išsaugoti pranešimų temas"
                  : "Įjungti Push pranešimus"
              }
              variant="primary"
              loading={pushSaving}
              onPress={() => handleSavePush(true)}
            />
            {pushActive ? (
              <Button
                label="Išjungti Push pranešimus šiame įrenginyje"
                variant="outline"
                disabled={pushSaving}
                onPress={() => handleSavePush(false)}
              />
            ) : null}
          </Card>

          <Card style={s.sectionCard}>
            <Text style={s.sectionHeader}>KEISTI SLAPTAŽODĮ</Text>
            <Field
              label="Naujas slaptažodis (8–72 simboliai)"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="••••••••"
              autoCapitalize="none"
            />
            <Button
              label="Išsaugoti naują slaptažodį"
              variant="secondary"
              loading={passwordBusy}
              onPress={handlePasswordChange}
            />
          </Card>

          <Button
            label="Atsijungti"
            variant="destructive"
            icon={<LogOut size={theme.spacing.lg} color={theme.colors.primaryForeground} />}
            onPress={signOut}
          />
        </ScrollView>
      ) : null}

      <SheetModal
        visible={Boolean(selectedRider)}
        onClose={() => {
          setSelectedRider(null);
          setRebindOpen(false);
        }}
        title={
          selectedRider
            ? `${selectedRider.name} ${selectedRider.surname}`
            : "Klientas"
        }
      >
        {selectedRider ? (
          <View style={s.sheetBody}>
            <Card style={s.sectionCard}>
              <Text style={s.sectionHeader}>PLANAS IR APYRANKĖ</Text>
              <Text style={s.clientName}>
                {selectedRider.planId
                  ? planById.get(selectedRider.planId)?.name ?? "Planas"
                  : "Planas nepriskirtas"}
              </Text>
              <Text style={s.clientMeta}>
                Apyrankė:{" "}
                {cardByRiderId.get(selectedRider.id)
                  ? `#${cardByRiderId.get(selectedRider.id)}`
                  : "Nepriskirta"}
              </Text>
              <Button
                label={rebindOpen ? "Atšaukti skenavimą" : "Priskirti / pakeisti apyrankę"}
                variant="secondary"
                icon={
                  <CreditCard
                    size={theme.spacing.lg}
                    color={theme.colors.secondaryForeground}
                  />
                }
                onPress={() => setRebindOpen((prev) => !prev)}
              />
              {rebindOpen ? (
                <UsbScanTarget
                  enabled={rebindOpen}
                  title="Nuskenuokite naują apyrankę per USB skaitytuvą"
                  onScan={handleBindCard}
                />
              ) : null}
            </Card>

            <View style={s.contactActions}>
              {selectedRider.phone ? (
                <Button
                  label={`Skambinti (${selectedRider.phone})`}
                  variant="outline"
                  icon={<Phone size={theme.spacing.lg} color={theme.colors.foreground} />}
                  onPress={() => Linking.openURL(`tel:${selectedRider.phone}`)}
                />
              ) : null}
              {selectedRider.email ? (
                <Button
                  label={selectedRider.email}
                  variant="outline"
                  icon={<Mail size={theme.spacing.lg} color={theme.colors.foreground} />}
                  onPress={() => Linking.openURL(`mailto:${selectedRider.email}`)}
                />
              ) : null}
            </View>

            {riderWaivers.length > 0 || riderDocuments.length > 0 ? (
              <View style={s.sectionBlock}>
                <Text style={s.sectionHeader}>DOKUMENTAI IR SUTIKIMAI</Text>
                {riderWaivers.map((w) => (
                  <Button
                    key={w.id}
                    label={`Sutikimas (${w.termsVersion}) · ${formatDay(w.signedAt.slice(0, 10))}`}
                    variant="outline"
                    icon={<FileText size={theme.spacing.lg} color={theme.colors.foreground} />}
                    onPress={() => handleOpenStorageFile("rider-waivers", w.signaturePath)}
                  />
                ))}
                {riderDocuments.map((doc) => (
                  <Button
                    key={doc.id}
                    label={doc.fileName}
                    variant="outline"
                    icon={<FileText size={theme.spacing.lg} color={theme.colors.foreground} />}
                    onPress={() => handleOpenStorageFile("rider-documents", doc.filePath)}
                  />
                ))}
              </View>
            ) : null}

            {riderPurchases.length > 0 ? (
              <View style={s.sectionBlock}>
                <Text style={s.sectionHeader}>PIRKIMŲ ISTORIJA</Text>
                {riderPurchases.map((p) => (
                  <View key={p.id} style={s.historyRow}>
                    <Text style={s.saleTitle}>{p.planName}</Text>
                    <Text style={s.saleSub}>
                      {p.price ? formatEuro(p.price) : "0 €"} ·{" "}
                      {formatDay(p.soldAt.slice(0, 10))}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={s.sectionBlock}>
              <Text style={s.sectionHeader}>DARBUOTOJŲ KOMENTARAI</Text>
              {riderComments.map((c) => (
                <Card key={c.id} style={s.commentCard}>
                  <Text style={s.saleTitle}>{c.text}</Text>
                  <Text style={s.saleSub}>
                    {c.authorName} · {formatDay(c.createdAt.slice(0, 10))}
                  </Text>
                </Card>
              ))}
              <Field
                label="Naujas komentaras"
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Pastaba apie klientą..."
              />
              <Button
                label="Pridėti komentarą"
                variant="primary"
                loading={commentBusy}
                onPress={handleAddComment}
              />
            </View>
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
    flex: {
      flex: 1,
    },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      gap: theme.spacing.sm,
      borderBottomWidth: theme.spacing.hairline,
      borderBottomColor: theme.colors.border,
    },
    title: {
      ...theme.type.heading,
      color: theme.colors.foreground,
    },
    subTabRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
    },
    searchBox: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
    },
    listContent: {
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    clientCard: {
      gap: theme.spacing.xxs,
    },
    clientTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    clientName: {
      ...theme.type.item,
      color: theme.colors.foreground,
    },
    cardBadge: {
      ...theme.type.xsBold,
      color: theme.colors.rust,
    },
    clientPlan: {
      ...theme.type.xsBold,
      color: theme.colors.lakeSoft,
    },
    clientMeta: {
      ...theme.type.xs,
      color: theme.colors.mutedForeground,
    },
    kpiGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
    },
    kpiCard: {
      flex: 1,
      minWidth: theme.spacing.scanCircle,
      gap: theme.spacing.xs,
    },
    kpiLabel: {
      ...theme.type.micro,
      color: theme.colors.mutedForeground,
      textTransform: "uppercase",
    },
    kpiTotal: {
      ...theme.type.figure,
      color: theme.colors.rust,
    },
    kpiFigure: {
      ...theme.type.figure,
      color: theme.colors.foreground,
    },
    sectionHeader: {
      ...theme.type.micro,
      color: theme.colors.mutedForeground,
      textTransform: "uppercase",
    },
    saleCard: {
      gap: theme.spacing.xxs,
    },
    saleTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    saleTitle: {
      ...theme.type.smBold,
      color: theme.colors.foreground,
      flex: 1,
    },
    saleAmount: {
      ...theme.type.smBold,
      color: theme.colors.rust,
    },
    saleBottom: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    saleSub: {
      ...theme.type.xs,
      color: theme.colors.mutedForeground,
    },
    sectionCard: {
      gap: theme.spacing.md,
    },
    profileHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    roleBadge: {
      ...theme.type.xsBold,
      color: theme.colors.lakeSoft,
    },
    topicRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
    },
    sheetBody: {
      gap: theme.spacing.lg,
    },
    contactActions: {
      gap: theme.spacing.sm,
    },
    sectionBlock: {
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.sm,
      borderTopWidth: theme.spacing.hairline,
      borderTopColor: theme.colors.border,
    },
    historyRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: theme.spacing.xs,
      borderBottomWidth: theme.spacing.hairline,
      borderBottomColor: theme.colors.border,
    },
    commentCard: {
      gap: theme.spacing.xxs,
    },
  });
