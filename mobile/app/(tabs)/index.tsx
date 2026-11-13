import React, { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Plus } from "lucide-react-native";
import { calendarEntries, entriesOn, ticketsFor, type CalendarEntry, type CalendarKind } from "@/lib/admin/calendar-entries";
import { hasPermission } from "@/lib/admin/permissions";
import type { Booking, ManagedEvent, QuadRental } from "@/lib/admin/types";
import { dateKey } from "@/lib/sauna";
import { Chip } from "@/mobile/src/components/primitives";
import { AgendaView } from "@/mobile/src/components/today/agenda-view";
import { BookingDetailModal } from "@/mobile/src/components/today/booking-detail-modal";
import { EventDetailModal } from "@/mobile/src/components/today/event-detail-modal";
import { NewBookingModal } from "@/mobile/src/components/today/new-booking-modal";
import { PendingView } from "@/mobile/src/components/today/pending-view";
import { RentalDetailModal } from "@/mobile/src/components/today/rental-detail-modal";
import { SaunaBlocksView } from "@/mobile/src/components/today/sauna-blocks-view";
import { usePendingRequests } from "@/mobile/src/components/today/use-pending-requests";
import { useTodayStyles } from "@/mobile/src/components/today/use-today-styles";
import { WeekStrip } from "@/mobile/src/components/today/week-strip";
import { useReadyAdmin } from "@/mobile/src/store/admin-context";
import { useAppTheme, type AppTheme } from "@/mobile/src/theme/use-app-theme";

type SubView = "agenda" | "pending" | "blocks";

/** The "Šiandien" tab: agenda, requests waiting for staff and sauna hour blocks, plus the detail and new-booking sheets. */
export default function TodayScreen() {
  const theme = useAppTheme();
  const shared = useTodayStyles();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { access, data, refreshing, refresh, setBookingStatus, setRentalStatus, cancelRequest, createBooking } = useReadyAdmin();

  const today = dateKey(new Date());
  const [selectedDay, setSelectedDay] = useState(today);
  const [subView, setSubView] = useState<SubView>("agenda");
  const [kindFilter, setKindFilter] = useState<CalendarKind | "visos">("visos");

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedRental, setSelectedRental] = useState<QuadRental | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ManagedEvent | null>(null);
  const [creatingBooking, setCreatingBooking] = useState(false);

  const canBook = hasPermission(access, "rezervacijos");
  const canBlocks = hasPermission(access, "uzimtumas") || canBook;
  const canQuads = hasPermission(access, "keturraciai");
  const canEvents = hasPermission(access, "renginiai");

  const pending = usePendingRequests(data);

  const allEntries = useMemo(
    () =>
      calendarEntries({
        bookings: data.bookings,
        stayTypes: data.stayTypes,
        quadRentals: data.quadRentals,
        quadTypes: data.quadTypes,
        events: data.events,
      }),
    [data.bookings, data.stayTypes, data.quadRentals, data.quadTypes, data.events],
  );

  const dayEntries = useMemo(() => {
    const entries = entriesOn(allEntries, selectedDay);
    return kindFilter === "visos" ? entries : entries.filter((e) => e.kind === kindFilter);
  }, [allEntries, selectedDay, kindFilter]);

  const openEntry = (entry: CalendarEntry) => {
    if (entry.key.startsWith("booking:")) setSelectedBooking(data.bookings.find((x) => x.id === entry.id) ?? null);
    else if (entry.key.startsWith("rental:")) setSelectedRental(data.quadRentals.find((x) => x.id === entry.id) ?? null);
    else if (entry.key.startsWith("event:")) setSelectedEvent(data.events.find((x) => x.id === entry.id) ?? null);
  };

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
        <View style={shared.chipRow}>
          <Chip label="Dienotvarkė" count={dayEntries.length} active={subView === "agenda"} onPress={() => setSubView("agenda")} />
          <Chip label="Laukia patvirtinimo" count={pending.total} active={subView === "pending"} onPress={() => setSubView("pending")} />
          {canBlocks ? <Chip label="Pirties valandos" active={subView === "blocks"} onPress={() => setSubView("blocks")} /> : null}
        </View>

        {subView !== "pending" ? (
          <WeekStrip selectedDay={selectedDay} today={today} onSelect={setSelectedDay} countOn={(day) => entriesOn(allEntries, day).length} />
        ) : null}

        {subView === "agenda" ? <AgendaView entries={dayEntries} kindFilter={kindFilter} onKindFilter={setKindFilter} onOpen={openEntry} /> : null}
        {subView === "pending" ? (
          <PendingView
            pending={pending}
            canBook={canBook}
            canQuads={canQuads}
            canEvents={canEvents}
            onOpenBooking={setSelectedBooking}
            onOpenRental={setSelectedRental}
          />
        ) : null}
        {subView === "blocks" ? <SaunaBlocksView day={selectedDay} /> : null}
      </ScrollView>

      {canBook ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Nauja rezervacija" onPress={() => setCreatingBooking(true)} style={styles.fab}>
          <Plus size={24} color={theme.colors.onRust} />
        </Pressable>
      ) : null}

      {/* The lists hold the live row, so a status change shows in an open sheet without reopening it. */}
      <BookingDetailModal
        booking={selectedBooking ? (data.bookings.find((b) => b.id === selectedBooking.id) ?? selectedBooking) : null}
        onClose={() => setSelectedBooking(null)}
        canEdit={canBook}
        onStatus={async (id, status) => {
          await setBookingStatus(id, status);
          setSelectedBooking(null);
        }}
        onCancel={async (id, refund) => {
          await cancelRequest("booking", id, refund);
          setSelectedBooking(null);
        }}
      />
      <RentalDetailModal
        rental={selectedRental ? (data.quadRentals.find((r) => r.id === selectedRental.id) ?? selectedRental) : null}
        onClose={() => setSelectedRental(null)}
        canEdit={canQuads}
        onStatus={async (id, status) => {
          await setRentalStatus(id, status);
          setSelectedRental(null);
        }}
        onCancel={async (id, refund) => {
          await cancelRequest("rental", id, refund);
          setSelectedRental(null);
        }}
      />
      <EventDetailModal
        event={selectedEvent}
        tickets={selectedEvent ? ticketsFor(selectedEvent.id, data.tourTickets, data.eventTickets) : []}
        onClose={() => setSelectedEvent(null)}
      />
      <NewBookingModal
        visible={creatingBooking}
        defaultDate={selectedDay}
        onClose={() => setCreatingBooking(false)}
        onSubmit={async (input) => {
          const ok = await createBooking(input);
          if (ok) setCreatingBooking(false);
        }}
      />
    </View>
  );
}

function createStyles({ colors, spacing }: AppTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { padding: spacing.lg, paddingBottom: spacing.section * 3, gap: spacing.md },
    fab: {
      position: "absolute",
      right: spacing.lg,
      bottom: spacing.lg,
      width: spacing.touchLg,
      height: spacing.touchLg,
      backgroundColor: colors.rust,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
