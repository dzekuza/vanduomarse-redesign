import React, { useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { AlertCircle, Check, Plus, RefreshCw, Waves } from "lucide-react-native";
import { formatEur } from "@/lib/admin/format";
import { hasPermission } from "@/lib/admin/permissions";
import type { RidePlanCategory, Rider, RiderSession } from "@/lib/admin/types";
import { RIDE_PLAN_CATEGORIES } from "@/lib/ride-plans";
import { Button, Card, Chip, EmptyState, Field, SheetModal } from "@/mobile/src/components/primitives";
import { UsbScanTarget } from "@/mobile/src/components/usb-scan-target";
import { getRiderByCardMobile, searchRidersMobile } from "@/mobile/src/lib/admin-api";
import { useReadyAdmin } from "@/mobile/src/store/admin-context";
import { useAppTheme, type AppTheme } from "@/mobile/src/theme/use-app-theme";

type Mode = "instruktorius" | "apyrankes";

type InstructorScanOutcome =
  | { rider: Rider; session: RiderSession; action: "checked_in" | "checked_out" }
  | { unknownCard: string };

function formatDuration(startedAt: string, endedAt: string | null, nowMs: number): string {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : nowMs;
  const totalSec = Math.max(0, Math.floor((end - start) / 1000));
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hrs > 0) {
    return `${hrs} val. ${String(mins).padStart(2, "0")} min.`;
  }
  return `${mins} min. ${String(secs).padStart(2, "0")} s`;
}

export default function ScanScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {
    access,
    data,
    refreshing,
    refresh,
    scanRiderSession,
    bindRiderCard,
    createRider,
    updateRiderPlan,
  } = useReadyAdmin();

  const canInstructor = hasPermission(access, "instruktorius");
  const canBracelets = hasPermission(access, "apyrankes");

  const [mode, setMode] = useState<Mode>(canInstructor ? "instruktorius" : "apyrankes");
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Instructor state
  const [scanning, setScanning] = useState(false);
  const [instructorResult, setInstructorResult] = useState<InstructorScanOutcome | null>(null);

  // Apyrankės / Pardavimas state
  const [inspectedCard, setInspectedCard] = useState<string | null>(null);
  const [inspectedRider, setInspectedRider] = useState<Rider | null>(null);
  const [riderQuery, setRiderQuery] = useState("");
  const [riderMatches, setRiderMatches] = useState<Rider[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<RidePlanCategory>(RIDE_PLAN_CATEGORIES[0]);
  const [creatingRider, setCreatingRider] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSurname, setNewSurname] = useState("");
  const [newPlanId, setNewPlanId] = useState("");
  const [bindingCardForRider, setBindingCardForRider] = useState<Rider | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const q = riderQuery.trim();
    if (q.length < 2) {
      setRiderMatches([]);
      return;
    }
    let cancelled = false;
    searchRidersMobile(q, 20).then((rows) => {
      if (!cancelled) setRiderMatches(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [riderQuery]);

  const activeWaterSessions = useMemo(
    () =>
      data.riderSessions
        .filter((s) => s.endedAt === null)
        .map((session) => ({
          session,
          rider: data.riders.find((r) => r.id === session.riderId),
        }))
        .filter((row): row is { session: RiderSession; rider: Rider } => row.rider !== undefined)
        .sort((a, b) => a.session.startedAt.localeCompare(b.session.startedAt)),
    [data.riderSessions, data.riders],
  );

  const planNameOf = (planId: string | null) => {
    if (!planId) return "Be plano";
    return data.ridePlans.find((p) => p.id === planId)?.name ?? "Planas";
  };

  const triggerHaptic = (ok: boolean) => {
    if (Platform.OS === "web") return;
    Haptics.notificationAsync(
      ok
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning,
    ).catch(() => undefined);
  };

  const handleInstructorScan = async (cardNumber: string) => {
    setScanning(true);
    const res = await scanRiderSession(cardNumber);
    setScanning(false);
    if ("data" in res) {
      triggerHaptic(true);
      setInstructorResult(res.data);
    } else if (res.error.code === "not_found") {
      triggerHaptic(false);
      setInstructorResult({ unknownCard: cardNumber });
    }
  };

  const handleBraceletInspectScan = async (cardNumber: string) => {
    setScanning(true);
    setStatusNotice(null);
    setInspectedCard(cardNumber);
    const localCard = data.riderCards.find((c) => c.cardNumber === cardNumber);
    const localRider = localCard ? data.riders.find((r) => r.id === localCard.riderId) : undefined;
    const rider = localRider ?? (await getRiderByCardMobile(cardNumber));
    setScanning(false);
    triggerHaptic(Boolean(rider));
    setInspectedRider(rider);
  };

  const activePlansInCategory = useMemo(
    () => data.ridePlans.filter((p) => p.active && p.category === selectedCategory),
    [data.ridePlans, selectedCategory],
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      keyboardShouldPersistTaps="handled"
    >
      {/* Top Mode Toggle */}
      {canInstructor && canBracelets ? (
        <View style={styles.chipRow}>
          <Chip
            label="Instruktorius (Vandenyje)"
            count={activeWaterSessions.length}
            active={mode === "instruktorius"}
            onPress={() => {
              setMode("instruktorius");
              setInstructorResult(null);
            }}
          />
          <Chip
            label="Apyrankės ir pardavimas"
            active={mode === "apyrankes"}
            onPress={() => {
              setMode("apyrankes");
              setInspectedCard(null);
              setInspectedRider(null);
            }}
          />
        </View>
      ) : null}

      {/* MODE 1: INSTRUKTORIUS */}
      {mode === "instruktorius" && canInstructor ? (
        <View style={styles.section}>
          <Card>
            {instructorResult ? (
              "unknownCard" in instructorResult ? (
                <View style={styles.resultBox}>
                  <AlertCircle size={theme.spacing.touch} color={theme.colors.statusBad} />
                  <Text style={styles.resultTitle}>Nežinoma apyrankė</Text>
                  <Text style={styles.resultSubtitle}>
                    Apyrankė {instructorResult.unknownCard} dar nepriskirta jokiam naudotojui.
                  </Text>
                  <View style={styles.actionRow}>
                    {canBracelets ? (
                      <Button
                        label="Priskirti Apyrankių skiltyje"
                        variant="coral"
                        small
                        onPress={() => {
                          const code = instructorResult.unknownCard;
                          setInstructorResult(null);
                          setMode("apyrankes");
                          setInspectedCard(code);
                          setInspectedRider(null);
                        }}
                      />
                    ) : null}
                    <Button
                      label="Skenuoti kitą"
                      variant="outline"
                      small
                      onPress={() => setInstructorResult(null)}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.resultBox}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarInitials}>
                      {instructorResult.rider.name.slice(0, 1)}
                      {instructorResult.rider.surname.slice(0, 1)}
                    </Text>
                  </View>
                  <Text style={styles.resultTitle}>
                    {instructorResult.rider.name} {instructorResult.rider.surname}
                  </Text>
                  <Text style={styles.planPill}>
                    {planNameOf(instructorResult.rider.planId)}
                  </Text>
                  <View
                    style={[
                      styles.actionPill,
                      {
                        backgroundColor:
                          instructorResult.action === "checked_in"
                            ? theme.colors.statusOk
                            : theme.colors.secondary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.actionPillText,
                        {
                          color:
                            instructorResult.action === "checked_in"
                              ? theme.colors.primaryForeground
                              : theme.colors.secondaryForeground,
                        },
                      ]}
                    >
                      {instructorResult.action === "checked_in"
                        ? "ATVYKO Į VANDENĮ"
                        : `IŠVYKO · ${formatDuration(
                            instructorResult.session.startedAt,
                            instructorResult.session.endedAt,
                            nowMs,
                          )}`}
                    </Text>
                  </View>
                  <Button
                    label="Skenuoti kitą"
                    variant="outline"
                    small
                    onPress={() => setInstructorResult(null)}
                  />
                </View>
              )
            ) : (
              <UsbScanTarget
                enabled={!scanning && !bindingCardForRider}
                title="Pasiruošta skenuoti"
                subtitle="Priglauskite apyrankę prie USB skaitytuvo — atvykimui arba išvykimui"
                onScan={handleInstructorScan}
              />
            )}
          </Card>

          <Card>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionHeading}>
                ŠIUO METU VANDENYJE ({activeWaterSessions.length})
              </Text>
              <Waves size={18} color={theme.colors.water} />
            </View>
            {activeWaterSessions.length === 0 ? (
              <EmptyState
                title="Vandenyje nieko nėra"
                subtitle="Nuskaitykite naudotojo apyrankę prieš jam lipant į vandenį."
              />
            ) : (
              activeWaterSessions.map(({ rider, session }) => (
                <View key={session.id} style={styles.sessionRow}>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.riderName}>
                      {rider.name} {rider.surname}
                    </Text>
                    <Text style={styles.riderMeta}>
                      {planNameOf(rider.planId)} · Apyrankė {session.cardNumber}
                    </Text>
                  </View>
                  <View style={styles.sessionRight}>
                    <Text style={styles.elapsedText}>
                      {formatDuration(session.startedAt, null, nowMs)}
                    </Text>
                    <Button
                      label="Išvyko"
                      variant="outline"
                      small
                      onPress={() => handleInstructorScan(session.cardNumber)}
                    />
                  </View>
                </View>
              ))
            )}
          </Card>
        </View>
      ) : null}

      {/* MODE 2: APYRANKĖS & PARDAVIMAS */}
      {mode === "apyrankes" && canBracelets ? (
        <View style={styles.section}>
          {statusNotice ? (
            <Card>
              <Text style={styles.noticeText}>{statusNotice}</Text>
            </Card>
          ) : null}

          <Card>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionHeading}>1. NUSKAITYKITE APYRANKĘ ARBA RASKITE KLIENTĄ</Text>
              <Button
                label="+ Naujas klientas"
                variant="outline"
                small
                icon={<Plus size={14} color={theme.colors.foreground} />}
                onPress={() => {
                  setNewPlanId(data.ridePlans.find((p) => p.active)?.id ?? "");
                  setCreatingRider(true);
                }}
              />
            </View>

            {!inspectedCard && !inspectedRider ? (
              <UsbScanTarget
                enabled={!scanning && !creatingRider && !bindingCardForRider}
                title="Priglauskite apyrankę patikrai"
                subtitle="Pamatysite savininką, aktyvų planą arba galėsite priskirti apyrankę"
                onScan={handleBraceletInspectScan}
              />
            ) : (
              <View style={styles.inspectedBox}>
                {inspectedCard ? (
                  <Text style={styles.microLabel}>APYRANKĖ NR. {inspectedCard}</Text>
                ) : null}
                {inspectedRider ? (
                  <>
                    <Text style={styles.resultTitle}>
                      {inspectedRider.name} {inspectedRider.surname}
                    </Text>
                    <Text style={styles.riderMeta}>
                      Dabartinis planas: {planNameOf(inspectedRider.planId)}
                    </Text>
                    {inspectedRider.phone ? (
                      <Text style={styles.riderMeta}>{inspectedRider.phone}</Text>
                    ) : null}
                  </>
                ) : (
                  <Text style={styles.resultSubtitle}>
                    Ši apyrankė dar nepriskirta. Pasirinkite klientą žemiau, kad priskirtumėte.
                  </Text>
                )}

                <View style={styles.actionRow}>
                  {inspectedRider ? (
                    <Button
                      label="Pakeisti apyrankę"
                      variant="outline"
                      small
                      icon={<RefreshCw size={14} color={theme.colors.foreground} />}
                      onPress={() => setBindingCardForRider(inspectedRider)}
                    />
                  ) : null}
                  <Button
                    label="Valyti / Skenuoti kitą"
                    variant="secondary"
                    small
                    onPress={() => {
                      setInspectedCard(null);
                      setInspectedRider(null);
                    }}
                  />
                </View>
              </View>
            )}

            <Field
              label="Kliento paieška (vardas, pavardė, tel.)"
              placeholder="Įveskite bent 2 raides…"
              value={riderQuery}
              onChangeText={setRiderQuery}
            />

            {riderMatches.map((r) => {
              const card = data.riderCards.find((c) => c.riderId === r.id);
              return (
                <Pressable
                  key={r.id}
                  onPress={() => {
                    setInspectedRider(r);
                    setInspectedCard(card?.cardNumber ?? inspectedCard);
                    setRiderQuery("");
                    setRiderMatches([]);
                  }}
                  style={styles.searchRow}
                >
                  <View style={styles.sessionInfo}>
                    <Text style={styles.riderName}>
                      {r.name} {r.surname}
                    </Text>
                    <Text style={styles.riderMeta}>
                      {planNameOf(r.planId)} · {card ? `Apyrankė ${card.cardNumber}` : "Be apyrankės"}
                    </Text>
                  </View>
                  {inspectedCard && !card ? (
                    <Button
                      label={`Susieti ${inspectedCard}`}
                      variant="coral"
                      small
                      onPress={async () => {
                        const res = await bindRiderCard(inspectedCard, r.id);
                        if (res) {
                          setInspectedRider(r);
                          setStatusNotice(
                            res.replacedName
                              ? `Apyrankė ${inspectedCard} perkelta iš ${res.replacedName}.`
                              : `Apyrankė ${inspectedCard} susieta su ${r.name} ${r.surname}.`,
                          );
                        }
                      }}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </Card>

          {/* Sell / Assign Plan to Selected Rider */}
          {inspectedRider ? (
            <Card>
              <Text style={styles.sectionHeading}>
                2. PARDUOTI PLANĄ: {inspectedRider.name.toUpperCase()}{" "}
                {inspectedRider.surname.toUpperCase()}
              </Text>
              <View style={styles.chipRow}>
                {RIDE_PLAN_CATEGORIES.map((cat) => (
                  <Chip
                    key={cat}
                    label={cat}
                    active={selectedCategory === cat}
                    onPress={() => setSelectedCategory(cat)}
                  />
                ))}
              </View>

              <View style={styles.planList}>
                {activePlansInCategory.map((plan) => {
                  const isCurrent = inspectedRider.planId === plan.id;
                  return (
                    <View key={plan.id} style={styles.planCard}>
                      <View style={styles.sessionInfo}>
                        <Text style={styles.riderName}>{plan.name}</Text>
                        {plan.description ? (
                          <Text style={styles.riderMeta}>{plan.description}</Text>
                        ) : null}
                        <Text style={styles.priceFigure}>
                          {plan.price === null ? "Nemokamas" : formatEur(plan.price)}
                        </Text>
                      </View>
                      <Button
                        label={isCurrent ? "Parduoti dar kartą" : "Priskirti / Parduoti"}
                        variant={isCurrent ? "outline" : "coral"}
                        small
                        icon={<Check size={14} color={isCurrent ? theme.colors.foreground : theme.colors.onRust} />}
                        onPress={async () => {
                          const ok = await updateRiderPlan(inspectedRider.id, plan.id);
                          if (ok) {
                            triggerHaptic(true);
                            setInspectedRider({ ...inspectedRider, planId: plan.id });
                            setStatusNotice(
                              `Planas „${plan.name}“ parduotas klientui ${inspectedRider.name} ${inspectedRider.surname}.`,
                            );
                          }
                        }}
                      />
                    </View>
                  );
                })}
              </View>
            </Card>
          ) : null}
        </View>
      ) : null}

      {/* Rebind Bracelet Modal */}
      <SheetModal
        visible={Boolean(bindingCardForRider)}
        title="Priskirti apyrankę"
        subtitle={
          bindingCardForRider
            ? `${bindingCardForRider.name} ${bindingCardForRider.surname}`
            : undefined
        }
        onClose={() => setBindingCardForRider(null)}
      >
        {bindingCardForRider ? (
          <UsbScanTarget
            enabled
            title="Priglauskite naują apyrankę"
            subtitle="Tai pakeis ankstesnę šio kliento apyrankę"
            onScan={async (cardNumber) => {
              const res = await bindRiderCard(cardNumber, bindingCardForRider.id);
              if (res) {
                triggerHaptic(true);
                setInspectedCard(cardNumber);
                setStatusNotice(
                  res.replacedName
                    ? `Apyrankė ${cardNumber} perkelta iš ${res.replacedName}.`
                    : `Apyrankė ${cardNumber} priskirta ${bindingCardForRider.name} ${bindingCardForRider.surname}.`,
                );
                setBindingCardForRider(null);
              }
            }}
          />
        ) : null}
      </SheetModal>

      {/* Create New Rider Modal */}
      <SheetModal
        visible={creatingRider}
        title="Naujas klientas"
        subtitle="Sukuriamas profilis ir priskiriamas pradinis planas"
        onClose={() => setCreatingRider(false)}
      >
        <Field label="Vardas" value={newName} onChangeText={setNewName} />
        <Field label="Pavardė" value={newSurname} onChangeText={setNewSurname} />

        <Text style={styles.microLabel}>PRADINIS PLANAS</Text>
        <View style={styles.chipRow}>
          {data.ridePlans
            .filter((p) => p.active)
            .slice(0, 8)
            .map((p) => (
              <Chip
                key={p.id}
                label={`${p.name} (${p.price === null ? "0 €" : formatEur(p.price)})`}
                active={newPlanId === p.id}
                onPress={() => setNewPlanId(p.id)}
              />
            ))}
        </View>

        <Button
          label="Sukurti klientą"
          variant="coral"
          disabled={!newName.trim() || !newSurname.trim() || !newPlanId}
          onPress={async () => {
            const riderId = await createRider({
              name: newName,
              surname: newSurname,
              planId: newPlanId,
            });
            if (riderId) {
              setCreatingRider(false);
              setNewName("");
              setNewSurname("");
              if (inspectedCard) {
                await bindRiderCard(inspectedCard, riderId);
              }
            }
          }}
        />
      </SheetModal>
    </ScrollView>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, spacing, type, radii } = theme;
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.section * 2,
      gap: spacing.md,
    },
    section: {
      gap: spacing.md,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    rowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    sectionHeading: {
      ...type.xsBold,
      color: colors.foreground,
      flex: 1,
    },
    microLabel: {
      ...type.micro,
      color: colors.rust,
      textTransform: "uppercase",
    },
    resultBox: {
      alignItems: "center",
      paddingVertical: spacing.lg,
      gap: spacing.sm,
    },
    avatarCircle: {
      width: spacing.avatarLg,
      height: spacing.avatarLg,
      borderRadius: radii.pill,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarInitials: {
      ...type.figure,
      color: colors.secondaryForeground,
    },
    resultTitle: {
      ...type.heading,
      color: colors.foreground,
      textAlign: "center",
    },
    resultSubtitle: {
      ...type.sm,
      color: colors.mutedForeground,
      textAlign: "center",
    },
    planPill: {
      ...type.xsBold,
      color: colors.foreground,
      backgroundColor: colors.muted,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xxs,
    },
    actionPill: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xs,
    },
    actionPillText: {
      ...type.xsBold,
    },
    actionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    sessionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.sm,
      borderTopWidth: spacing.hairline,
      borderTopColor: colors.border,
      gap: spacing.sm,
    },
    sessionInfo: {
      flex: 1,
      gap: spacing.xxs,
    },
    sessionRight: {
      alignItems: "flex-end",
      gap: spacing.xs,
    },
    riderName: {
      ...type.smBold,
      color: colors.foreground,
    },
    riderMeta: {
      ...type.xs,
      color: colors.mutedForeground,
    },
    elapsedText: {
      ...type.smBold,
      color: colors.water,
    },
    inspectedBox: {
      padding: spacing.md,
      backgroundColor: colors.muted,
      borderWidth: spacing.hairline,
      borderColor: colors.border,
      gap: spacing.xs,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.sm,
      borderTopWidth: spacing.hairline,
      borderTopColor: colors.border,
      gap: spacing.sm,
    },
    planList: {
      gap: spacing.sm,
    },
    planCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.sm,
      borderTopWidth: spacing.hairline,
      borderTopColor: colors.border,
      gap: spacing.sm,
    },
    priceFigure: {
      ...type.smBold,
      color: colors.rust,
    },
    noticeText: {
      ...type.xsBold,
      color: colors.statusOk,
    },
  });
}
