import React, { useMemo, useState } from "react";
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Inbox, Mail, Phone } from "lucide-react-native";
import { formatDateTime, formatDay, formatEurRange } from "@/lib/admin/format";
import { INQUIRY_SOURCE, INQUIRY_STATUS } from "@/lib/admin/labels";
import type { Inquiry, InquiryStatus } from "@/lib/admin/types";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  InquiryStatusBadge,
  SheetModal,
} from "@/mobile/src/components/primitives";
import { useReadyAdmin } from "@/mobile/src/store/admin-context";
import { useAppTheme, type AppTheme } from "@/mobile/src/theme/use-app-theme";

const STATUSES: InquiryStatus[] = ["nauja", "susisiekta", "pasiulymas"];

export default function InquiriesScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {
    data,
    refreshing,
    refresh,
    setInquiryStatus,
    addInquiryNote,
    acceptInquiry,
    releaseInquiry,
  } = useReadyAdmin();

  const [filter, setFilter] = useState<InquiryStatus | "visos">("visos");
  const [openId, setOpenId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  const filtered = useMemo(
    () =>
      data.inquiries.filter((q) => filter === "visos" || q.status === filter),
    [data.inquiries, filter],
  );

  const selectedInquiry: Inquiry | null = useMemo(
    () => (openId ? (data.inquiries.find((q) => q.id === openId) ?? null) : null),
    [data.inquiries, openId],
  );

  const hasHoldableItems =
    selectedInquiry &&
    (selectedInquiry.stays.length > 0 ||
      selectedInquiry.saunas.some((s) => s.startHour !== null));

  return (
    <View style={styles.screen}>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <View style={styles.chipRow}>
          <Chip
            label="Visos"
            count={data.inquiries.length}
            active={filter === "visos"}
            onPress={() => setFilter("visos")}
          />
          {STATUSES.map((s) => (
            <Chip
              key={s}
              label={INQUIRY_STATUS[s]}
              count={data.inquiries.filter((q) => q.status === s).length}
              active={filter === s}
              onPress={() => setFilter(s)}
            />
          ))}
        </View>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Inbox size={24} color={theme.colors.mutedForeground} />}
            title="Užklausų nėra"
            subtitle="Pagal pasirinktą būseną šiuo metu užklausų nėra."
          />
        ) : (
          filtered.map((q) => (
            <Card key={q.id} onPress={() => setOpenId(q.id)}>
              <View style={styles.rowBetween}>
                <View style={styles.body}>
                  <Text style={styles.microLabel}>
                    {INQUIRY_SOURCE[q.source]} · {q.eventType}
                  </Text>
                  <Text style={styles.title}>{q.customer.name}</Text>
                  <Text style={styles.meta}>
                    {q.date ? formatDay(q.date) : "Data nenurodyta"} · {q.guests} asm. ·{" "}
                    {q.space}
                  </Text>
                  {q.estimate ? (
                    <Text style={styles.estimateText}>
                      Sąmata: {formatEurRange(q.estimate)}
                    </Text>
                  ) : null}
                  {q.acceptedAt ? (
                    <Text style={styles.acceptedTag}>Namukai / pirtis užimti</Text>
                  ) : null}
                </View>
                <InquiryStatusBadge status={q.status} />
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Inquiry Details Sheet */}
      <SheetModal
        visible={Boolean(selectedInquiry)}
        title={selectedInquiry ? `${selectedInquiry.customer.name} · ${selectedInquiry.eventType}` : ""}
        subtitle={
          selectedInquiry
            ? `${selectedInquiry.date ? formatDay(selectedInquiry.date) : "Be datos"} · ${selectedInquiry.guests} asm.`
            : undefined
        }
        onClose={() => {
          setOpenId(null);
          setNoteText("");
        }}
      >
        {selectedInquiry ? (
          <>
            <View style={styles.chipRow}>
              {STATUSES.map((s) => (
                <Chip
                  key={s}
                  label={INQUIRY_STATUS[s]}
                  active={selectedInquiry.status === s}
                  onPress={() => setInquiryStatus(selectedInquiry.id, s)}
                />
              ))}
            </View>

            <Card>
              <Text style={styles.microLabel}>KONTAKTAI</Text>
              <Text style={styles.title}>{selectedInquiry.customer.name}</Text>
              {selectedInquiry.customer.phone ? (
                <Pressable
                  onPress={() => Linking.openURL(`tel:${selectedInquiry.customer.phone}`)}
                  style={styles.contactRow}
                >
                  <Phone size={16} color={theme.colors.rust} />
                  <Text style={styles.linkText}>{selectedInquiry.customer.phone}</Text>
                </Pressable>
              ) : null}
              {selectedInquiry.customer.email ? (
                <Pressable
                  onPress={() => Linking.openURL(`mailto:${selectedInquiry.customer.email}`)}
                  style={styles.contactRow}
                >
                  <Mail size={16} color={theme.colors.rust} />
                  <Text style={styles.linkText}>{selectedInquiry.customer.email}</Text>
                </Pressable>
              ) : null}
            </Card>

            <Card>
              <Text style={styles.microLabel}>ŠVENTĖS DETALĖS</Text>
              <Text style={styles.meta}>
                Erdvė: {selectedInquiry.space} · Svečiai: {selectedInquiry.guests} asm.
              </Text>
              {selectedInquiry.estimate ? (
                <Text style={styles.estimateText}>
                  Skaičiuoklės sąmata: {formatEurRange(selectedInquiry.estimate)}
                </Text>
              ) : null}
              {selectedInquiry.message ? (
                <Text style={styles.messageText}>{selectedInquiry.message}</Text>
              ) : null}
            </Card>

            {hasHoldableItems ? (
              <Card>
                <Text style={styles.microLabel}>NAKVYNĖ IR PIRTIS UŽKLAUSOJE</Text>
                {selectedInquiry.stays.map((st) => {
                  const label =
                    data.stayTypes.find((t) => t.id === st.typeId)?.label ?? st.typeId;
                  return (
                    <Text key={st.typeId} style={styles.meta}>
                      • {st.units} × {label} ({selectedInquiry.stayNights} nakt.)
                    </Text>
                  );
                })}
                {selectedInquiry.saunas.map((sa) => {
                  const saunaName =
                    data.saunas.find((s) => s.id === sa.saunaId)?.name ?? sa.saunaId;
                  return (
                    <Text key={sa.saunaId} style={styles.meta}>
                      • {saunaName}: {sa.hours} val.
                      {sa.startHour !== null ? ` (nuo ${sa.startHour}:00)` : ""}
                    </Text>
                  );
                })}

                {selectedInquiry.acceptedAt ? (
                  <Button
                    label="Atlaisvinti užimtus namelius / pirtį"
                    variant="outline"
                    onPress={() => releaseInquiry(selectedInquiry.id)}
                  />
                ) : (
                  <Button
                    label="Priimti ir užimti namelius / pirtį"
                    variant="coral"
                    onPress={() => acceptInquiry(selectedInquiry.id)}
                  />
                )}
              </Card>
            ) : null}

            <Card>
              <Text style={styles.microLabel}>
                DARBUOTOJŲ PASTABOS ({selectedInquiry.notes.length})
              </Text>
              {selectedInquiry.notes.map((n, idx) => (
                <View key={`${n.at}-${idx}`} style={styles.noteRow}>
                  <Text style={styles.noteDate}>{formatDateTime(n.at)}</Text>
                  <Text style={styles.messageText}>{n.text}</Text>
                </View>
              ))}

              <Field
                label="Nauja pastaba"
                placeholder="Įrašykite komentarą po pokalbio…"
                value={noteText}
                onChangeText={setNoteText}
                multiline
              />
              <Button
                label={submittingNote ? "Saugoma…" : "Pridėti pastabą"}
                variant="primary"
                disabled={submittingNote || !noteText.trim()}
                onPress={async () => {
                  setSubmittingNote(true);
                  const ok = await addInquiryNote(selectedInquiry.id, noteText);
                  setSubmittingNote(false);
                  if (ok) setNoteText("");
                }}
              />
            </Card>
          </>
        ) : null}
      </SheetModal>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, spacing, type } = theme;
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.section * 2,
      gap: spacing.md,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    rowBetween: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    body: {
      flex: 1,
      gap: spacing.xxs,
    },
    microLabel: {
      ...type.micro,
      color: colors.rust,
      textTransform: "uppercase",
    },
    title: {
      ...type.item,
      color: colors.foreground,
    },
    meta: {
      ...type.xs,
      color: colors.mutedForeground,
    },
    estimateText: {
      ...type.smBold,
      color: colors.foreground,
      marginTop: spacing.xxs,
    },
    acceptedTag: {
      ...type.micro,
      color: colors.statusOk,
      textTransform: "uppercase",
      marginTop: spacing.xxs,
    },
    contactRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      minHeight: spacing.touch,
    },
    linkText: {
      ...type.smBold,
      color: colors.rust,
    },
    messageText: {
      ...type.sm,
      color: colors.foreground,
    },
    noteRow: {
      borderTopWidth: spacing.hairline,
      borderTopColor: colors.border,
      paddingTop: spacing.xs,
      gap: spacing.xxs,
    },
    noteDate: {
      ...type.micro,
      color: colors.mutedForeground,
    },
  });
}
