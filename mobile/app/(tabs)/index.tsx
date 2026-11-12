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
import {
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Lock,
  Phone,
  Plus,
  X,
} from "lucide-react-native";
import {
  CALENDAR_KINDS,
  calendarEntries,
  entriesOn,
  seatsLabel,
  ticketsFor,
  weekDays,
  type CalendarEntry,
  type CalendarKind,
} from "@/lib/admin/calendar-entries";
import {
  bookingTypeLabel,
  bookingWhen,
  formatDay,
  formatEur,
  parseDay,
  quadRentalLabel,
} from "@/lib/admin/format";
import { BOOKING_SOURCE } from "@/lib/admin/labels";
import { hasPermission } from "@/lib/admin/permissions";
import type { Booking, ManagedEvent, QuadRental, TourTicket } from "@/lib/admin/types";
import { dateKey, formatHour } from "@/lib/sauna";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  PaymentStatusBadge,
  SheetModal,
  StatusBadge,
} from "@/mobile/src/components/primitives";
import { useReadyAdmin } from "@/mobile/src/store/admin-context";
import { useAppTheme, type AppTheme } from "@/mobile/src/theme/use-app-theme";

type SubView = "agenda" | "pending" | "blocks";

export default function TodayScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {
    access,
    data,
    refreshing,
    refresh,
    setBookingStatus,
    setRentalStatus,
    setTourTicketStatus,
    cancelRequest,
    toggleBlock,
    createBooking,
  } = useReadyAdmin();

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

  const pendingBookings = useMemo(
    () => data.bookings.filter((b) => b.status === "laukia"),
    [data.bookings],
  );
  const pendingRentals = useMemo(
    () => data.quadRentals.filter((r) => r.status === "laukia"),
    [data.quadRentals],
  );
  const pendingTickets = useMemo(
    () => [
      ...data.tourTickets.filter((t) => t.status === "laukia"),
      ...data.eventTickets.filter((t) => t.status === "laukia"),
    ],
    [data.tourTickets, data.eventTickets],
  );
  const totalPending = pendingBookings.length + pendingRentals.length + pendingTickets.length;

  const week = useMemo(() => weekDays(selectedDay), [selectedDay]);

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

  const shiftWeek = (dir: -1 | 1) => {
    const d = parseDay(selectedDay);
    d.setDate(d.getDate() + dir * 7);
    setSelectedDay(dateKey(d));
  };

  const openEntry = (entry: CalendarEntry) => {
    if (entry.key.startsWith("booking:")) {
      const b = data.bookings.find((x) => x.id === entry.id) ?? null;
      setSelectedBooking(b);
    } else if (entry.key.startsWith("rental:")) {
      const r = data.quadRentals.find((x) => x.id === entry.id) ?? null;
      setSelectedRental(r);
    } else if (entry.key.startsWith("event:")) {
      const e = data.events.find((x) => x.id === entry.id) ?? null;
      setSelectedEvent(e);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {/* Top Sub-View Switcher */}
        <View style={styles.chipRow}>
          <Chip
            label="Dienotvarkė"
            count={dayEntries.length}
            active={subView === "agenda"}
            onPress={() => setSubView("agenda")}
          />
          <Chip
            label="Laukia patvirtinimo"
            count={totalPending}
            active={subView === "pending"}
            onPress={() => setSubView("pending")}
          />
          {canBlocks ? (
            <Chip
              label="Pirties valandos"
              active={subView === "blocks"}
              onPress={() => setSubView("blocks")}
            />
          ) : null}
        </View>

        {/* Week Date Strip (shared across Agenda and Sauna Blocks) */}
        {subView !== "pending" ? (
          <Card>
            <View style={styles.weekHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ankstesnė savaitė"
                onPress={() => shiftWeek(-1)}
                style={styles.iconBtn}
              >
                <ChevronLeft size={20} color={theme.colors.foreground} />
              </Pressable>
              <Pressable onPress={() => setSelectedDay(today)}>
                <Text style={styles.weekTitle}>{formatDay(selectedDay)}</Text>
                {selectedDay !== today ? (
                  <Text style={styles.todayJump}>Grįžti į šiandieną</Text>
                ) : null}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Kita savaitė"
                onPress={() => shiftWeek(1)}
                style={styles.iconBtn}
              >
                <ChevronRight size={20} color={theme.colors.foreground} />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayStrip}
            >
              {week.map((day) => {
                const active = day === selectedDay;
                const count = entriesOn(allEntries, day).length;
                const dayNum = day.slice(8, 10);
                const label = formatDay(day).split(",")[0];
                return (
                  <Pressable
                    key={day}
                    accessibilityRole="button"
                    onPress={() => setSelectedDay(day)}
                    style={[
                      styles.dayTile,
                      active ? styles.dayTileActive : styles.dayTileInactive,
                    ]}
                  >
                    <Text style={active ? styles.dayLabelActive : styles.dayLabelInactive}>
                      {label}
                    </Text>
                    <Text style={active ? styles.dayNumActive : styles.dayNumInactive}>
                      {dayNum}
                    </Text>
                    <Text style={active ? styles.dayCountActive : styles.dayCountInactive}>
                      {count > 0 ? `${count} įr.` : "—"}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Card>
        ) : null}

        {/* SUB-VIEW 1: AGENDA */}
        {subView === "agenda" ? (
          <View style={styles.section}>
            <View style={styles.chipRow}>
              <Chip
                label="Visi"
                active={kindFilter === "visos"}
                onPress={() => setKindFilter("visos")}
              />
              {CALENDAR_KINDS.map((k) => (
                <Chip
                  key={k.id}
                  label={k.label}
                  active={kindFilter === k.id}
                  onPress={() => setKindFilter(k.id)}
                />
              ))}
            </View>

            {dayEntries.length === 0 ? (
              <EmptyState
                icon={<CalendarIcon size={24} color={theme.colors.mutedForeground} />}
                title="Šią dieną įrašų nėra"
                subtitle="Pasirinkite kitą dieną arba sukurkite naują rezervaciją."
              />
            ) : (
              dayEntries.map((entry) => (
                <Card key={entry.key} onPress={() => openEntry(entry)}>
                  <View style={styles.rowBetween}>
                    <View style={styles.rowLeft}>
                      <View
                        style={[
                          styles.kindBar,
                          {
                            backgroundColor:
                              entry.kind === "pirtis"
                                ? theme.colors.rust
                                : entry.kind === "namelis"
                                  ? theme.colors.lakeSoft
                                  : entry.kind === "keturraciai"
                                    ? theme.colors.calendarBrown
                                    : theme.colors.calendarPink,
                          },
                        ]}
                      />
                      <View style={styles.entryBody}>
                        <Text style={styles.entryTime}>
                          {entry.time || "Visa diena"} · {entry.title}
                        </Text>
                        <Text style={styles.entryCustomer}>
                          {entry.event
                            ? `${entry.detail} · Užimta: ${seatsLabel(entry.event)}`
                            : `${entry.customer.name} · ${entry.detail}`}
                        </Text>
                        {entry.reference ? (
                          <Text style={styles.entryRef}>{entry.reference}</Text>
                        ) : null}
                      </View>
                    </View>
                    {!entry.event ? <StatusBadge status={entry.status} /> : null}
                  </View>
                </Card>
              ))
            )}
          </View>
        ) : null}

        {/* SUB-VIEW 2: PENDING QUEUE */}
        {subView === "pending" ? (
          <View style={styles.section}>
            {totalPending === 0 ? (
              <EmptyState
                icon={<Check size={24} color={theme.colors.statusOk} />}
                title="Visos užklausos peržiūrėtos"
                subtitle="Naujų nepatvirtintų rezervacijų šiuo metu nėra."
              />
            ) : (
              <>
                {pendingBookings.map((b) => (
                  <Card key={b.id} onPress={() => setSelectedBooking(b)}>
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
                        <Button
                          label="Atidaryti"
                          variant="outline"
                          small
                          onPress={() => setSelectedBooking(b)}
                        />
                      </View>
                    ) : null}
                  </Card>
                ))}

                {pendingRentals.map((r) => (
                  <Card key={r.id} onPress={() => setSelectedRental(r)}>
                    <View style={styles.rowBetween}>
                      <View style={styles.entryBody}>
                        <Text style={styles.microLabel}>
                          Keturračiai · {r.reference}
                        </Text>
                        <Text style={styles.entryTime}>{r.customer.name}</Text>
                        <Text style={styles.entryCustomer}>
                          {formatDay(r.date)} · {formatHour(r.startHour)}–
                          {formatHour(r.startHour + r.hours)} · {formatEur(r.total)}
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
                        <Button
                          label="Atidaryti"
                          variant="outline"
                          small
                          onPress={() => setSelectedRental(r)}
                        />
                      </View>
                    ) : null}
                  </Card>
                ))}

                {pendingTickets.map((t: TourTicket) => (
                  <Card key={t.id}>
                    <View style={styles.rowBetween}>
                      <View style={styles.entryBody}>
                        <Text style={styles.microLabel}>
                          Bilietai · {t.reference}
                        </Text>
                        <Text style={styles.entryTime}>{t.customer.name}</Text>
                        <Text style={styles.entryCustomer}>
                          {t.eventTitle} · {formatDay(t.eventDate)} {t.eventTime} · {t.people} asm. ·{" "}
                          {formatEur(t.total)}
                        </Text>
                      </View>
                      <PaymentStatusBadge payment={t.payment} />
                    </View>
                    {canQuads || canEvents ? (
                      <View style={styles.actionRow}>
                        <Button
                          label="Patvirtinti"
                          variant="coral"
                          small
                          onPress={() => setTourTicketStatus(t.id, "patvirtinta")}
                        />
                        <Button
                          label="Atšaukti"
                          variant="outline"
                          small
                          onPress={() => cancelRequest("ticket", t.id, false)}
                        />
                      </View>
                    ) : null}
                  </Card>
                ))}
              </>
            )}
          </View>
        ) : null}

        {/* SUB-VIEW 3: SAUNA BLOCKS (CLOSE/OPEN HOURS) */}
        {subView === "blocks" ? (
          <View style={styles.section}>
            {data.saunas.map((sauna) => {
              const hours: number[] = [];
              for (let h = sauna.rates.openHour; h < sauna.rates.closeHour; h++) {
                hours.push(h);
              }
              return (
                <Card key={sauna.id}>
                  <Text style={styles.entryTime}>{sauna.name}</Text>
                  <Text style={styles.entryCustomer}>
                    Palieskite valandą, kad ją uždarytumėte arba atidarytumėte ({formatDay(selectedDay)}).
                  </Text>
                  <View style={styles.hourGrid}>
                    {hours.map((hour) => {
                      const booked = data.bookings.some(
                        (b) =>
                          b.kind === "pirtis" &&
                          b.saunaId === sauna.id &&
                          b.date === selectedDay &&
                          b.status !== "atsaukta" &&
                          b.startHour !== undefined &&
                          b.hours !== undefined &&
                          hour >= b.startHour &&
                          hour < b.startHour + b.hours,
                      );
                      const closed = data.blocks.some(
                        (bl) => bl.saunaId === sauna.id && bl.date === selectedDay && bl.hour === hour,
                      );

                      return (
                        <Pressable
                          key={hour}
                          disabled={booked}
                          onPress={() => toggleBlock(sauna.id, selectedDay, hour)}
                          style={[
                            styles.hourCell,
                            booked
                              ? styles.hourBooked
                              : closed
                                ? styles.hourClosed
                                : styles.hourOpen,
                          ]}
                        >
                          <Text
                            style={
                              booked || closed ? styles.hourTextLight : styles.hourTextDark
                            }
                          >
                            {formatHour(hour)}
                          </Text>
                          <Text
                            style={
                              booked || closed ? styles.hourSubLight : styles.hourSubDark
                            }
                          >
                            {booked ? "Rezervuota" : closed ? "Uždaryta" : "Laisva"}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Card>
              );
            })}
          </View>
        ) : null}
      </ScrollView>

      {/* Floating + New Booking Button */}
      {canBook ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nauja rezervacija"
          onPress={() => setCreatingBooking(true)}
          style={styles.fab}
        >
          <Plus size={24} color={theme.colors.onRust} />
        </Pressable>
      ) : null}

      {/* Booking Details Modal */}
      <BookingDetailModal
        booking={
          selectedBooking
            ? (data.bookings.find((b) => b.id === selectedBooking.id) ?? selectedBooking)
            : null
        }
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

      {/* Quad Rental Details Modal */}
      <RentalDetailModal
        rental={
          selectedRental
            ? (data.quadRentals.find((r) => r.id === selectedRental.id) ?? selectedRental)
            : null
        }
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

      {/* Event Details Modal */}
      <EventDetailModal
        event={selectedEvent}
        tickets={
          selectedEvent
            ? ticketsFor(selectedEvent.id, data.tourTickets, data.eventTickets)
            : []
        }
        onClose={() => setSelectedEvent(null)}
      />

      {/* New Booking Modal */}
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

function BookingDetailModal({
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
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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

      <Card>
        <Text style={styles.microLabel}>KLIENTAS</Text>
        <Text style={styles.entryTime}>{booking.customer.name}</Text>
        {booking.customer.phone ? (
          <Pressable
            onPress={() => Linking.openURL(`tel:${booking.customer.phone}`)}
            style={styles.contactRow}
          >
            <Phone size={16} color={theme.colors.rust} />
            <Text style={styles.linkText}>{booking.customer.phone}</Text>
          </Pressable>
        ) : null}
        {booking.customer.email ? (
          <Text style={styles.entryCustomer}>{booking.customer.email}</Text>
        ) : null}
      </Card>

      <Card>
        <Text style={styles.microLabel}>INFORMACIJA</Text>
        <Text style={styles.entryCustomer}>
          Svečiai: {booking.guests ?? "Nenurodyta"} · Šaltinis:{" "}
          {booking.source ? BOOKING_SOURCE[booking.source] : "Svetainė"}
        </Text>
        {booking.extras.length > 0 ? (
          <Text style={styles.entryCustomer}>Priedai: {booking.extras.join(", ")}</Text>
        ) : null}
        {booking.note ? <Text style={styles.entryCustomer}>Pastaba: {booking.note}</Text> : null}
        <Text style={styles.totalFigure}>Suma: {formatEur(booking.total)}</Text>
      </Card>

      {canEdit ? (
        <View style={styles.modalActions}>
          {booking.status === "laukia" ? (
            <Button
              label="Patvirtinti rezervaciją"
              variant="coral"
              onPress={() => onStatus(booking.id, "patvirtinta")}
            />
          ) : null}
          {booking.status === "patvirtinta" ? (
            <Button
              label="Pažymėti kaip įvykdytą"
              variant="primary"
              onPress={() => onStatus(booking.id, "ivykdyta")}
            />
          ) : null}
          {booking.status !== "atsaukta" ? (
            <>
              {paidOnline ? (
                <Button
                  label="Atšaukti ir grąžinti pinigus (Stripe)"
                  variant="destructive"
                  onPress={() => onCancel(booking.id, true)}
                />
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

function RentalDetailModal({
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
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { data } = useReadyAdmin();

  if (!rental) return null;
  const paidOnline = rental.payment?.status === "apmoketa" && rental.payment.refunded === 0;

  return (
    <SheetModal
      visible
      title={`Keturračiai · ${rental.reference}`}
      subtitle={`${formatDay(rental.date)} · ${formatHour(rental.startHour)}–${formatHour(
        rental.startHour + rental.hours,
      )}`}
      onClose={onClose}
    >
      <View style={styles.chipRow}>
        <StatusBadge status={rental.status} />
        <PaymentStatusBadge payment={rental.payment} />
      </View>

      <Card>
        <Text style={styles.microLabel}>KLIENTAS</Text>
        <Text style={styles.entryTime}>{rental.customer.name}</Text>
        {rental.customer.phone ? (
          <Pressable
            onPress={() => Linking.openURL(`tel:${rental.customer.phone}`)}
            style={styles.contactRow}
          >
            <Phone size={16} color={theme.colors.rust} />
            <Text style={styles.linkText}>{rental.customer.phone}</Text>
          </Pressable>
        ) : null}
        {rental.customer.email ? (
          <Text style={styles.entryCustomer}>{rental.customer.email}</Text>
        ) : null}
      </Card>

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
            <Button
              label="Patvirtinti nuomą"
              variant="coral"
              onPress={() => onStatus(rental.id, "patvirtinta")}
            />
          ) : null}
          {rental.status === "patvirtinta" ? (
            <Button
              label="Pažymėti kaip įvykdytą"
              variant="primary"
              onPress={() => onStatus(rental.id, "ivykdyta")}
            />
          ) : null}
          {rental.status !== "atsaukta" ? (
            <>
              {paidOnline ? (
                <Button
                  label="Atšaukti ir grąžinti pinigus (Stripe)"
                  variant="destructive"
                  onPress={() => onCancel(rental.id, true)}
                />
              ) : null}
              <Button
                label="Atšaukti nuomą"
                variant="outline"
                onPress={() => onCancel(rental.id, false)}
              />
            </>
          ) : null}
        </View>
      ) : null}
    </SheetModal>
  );
}

function EventDetailModal({
  event,
  tickets,
  onClose,
}: {
  event: ManagedEvent | null;
  tickets: TourTicket[];
  onClose: () => void;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!event) return null;

  return (
    <SheetModal
      visible
      title={event.title}
      subtitle={`${formatDay(event.date)} · ${event.time} · ${event.place}`}
      onClose={onClose}
    >
      <Card>
        <Text style={styles.microLabel}>UŽIMTUMAS</Text>
        <Text style={styles.entryTime}>
          Parduota vietų: {event.capacity ? `${event.sold} / ${event.capacity}` : event.sold}
        </Text>
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

function NewBookingModal({
  visible,
  defaultDate,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  defaultDate: string;
  onClose: () => void;
  onSubmit: (input: {
    kind: "pirtis" | "namelis" | "kemperis";
    saunaId?: string;
    date: string;
    startHour?: number;
    hours?: number;
    nights?: number;
    guests: number;
    customer: { name: string; phone: string; email: string };
    extras: Record<string, number>;
    total: number;
    status: "patvirtinta" | "laukia";
    source: "telefonu" | "vietoje";
    note: string;
  }) => Promise<void>;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { data } = useReadyAdmin();

  const [kind, setKind] = useState<"pirtis" | "namelis" | "kemperis">("pirtis");
  const [date, setDate] = useState(defaultDate);
  const [startHour, setStartHour] = useState("18");
  const [hours, setHours] = useState("3");
  const [nights, setNights] = useState("1");
  const [guests, setGuests] = useState("6");
  const [total, setTotal] = useState("160");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const firstSaunaId = data.saunas.find((s) => s.active)?.id ?? data.saunas[0]?.id ?? "pirtis-marse";

  const handleSave = async () => {
    if (name.trim().length < 2) return;
    setSaving(true);
    await onSubmit({
      kind,
      saunaId: kind === "pirtis" ? firstSaunaId : undefined,
      date,
      startHour: kind === "pirtis" ? Number(startHour) || 18 : undefined,
      hours: kind === "pirtis" ? Number(hours) || 2 : undefined,
      nights: kind !== "pirtis" ? Number(nights) || 1 : undefined,
      guests: Number(guests) || 2,
      customer: { name: name.trim(), phone: phone.trim(), email: "" },
      extras: {},
      total: Number(total) || 0,
      status: "patvirtinta",
      source: "telefonu",
      note,
    });
    setSaving(false);
  };

  return (
    <SheetModal
      visible={visible}
      title="Nauja rezervacija"
      subtitle="Registracija telefonu arba vietoje"
      onClose={onClose}
    >
      <View style={styles.chipRow}>
        <Chip label="Pirtis" active={kind === "pirtis"} onPress={() => setKind("pirtis")} />
        <Chip label="Namelis" active={kind === "namelis"} onPress={() => setKind("namelis")} />
        <Chip label="Kemperis" active={kind === "kemperis"} onPress={() => setKind("kemperis")} />
      </View>

      <Field label="Data (MMMM-MM-DD)" value={date} onChangeText={setDate} />

      {kind === "pirtis" ? (
        <View style={styles.rowBetween}>
          <View style={styles.halfField}>
            <Field
              label="Pradžios val. (0–23)"
              value={startHour}
              onChangeText={setStartHour}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.halfField}>
            <Field
              label="Valandos"
              value={hours}
              onChangeText={setHours}
              keyboardType="number-pad"
            />
          </View>
        </View>
      ) : (
        <Field
          label="Naktų skaičius"
          value={nights}
          onChangeText={setNights}
          keyboardType="number-pad"
        />
      )}

      <View style={styles.rowBetween}>
        <View style={styles.halfField}>
          <Field
            label="Svečių skaičius"
            value={guests}
            onChangeText={setGuests}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.halfField}>
          <Field
            label="Suma (€)"
            value={total}
            onChangeText={setTotal}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <Field label="Kliento vardas" placeholder="Vardas Pavardė" value={name} onChangeText={setName} />
      <Field
        label="Telefonas"
        placeholder="+3706..."
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <Field label="Pastaba" placeholder="Papildoma informacija" value={note} onChangeText={setNote} />

      <Button
        label={saving ? "Saugoma…" : "Sukurti rezervaciją"}
        variant="coral"
        disabled={saving || name.trim().length < 2}
        onPress={handleSave}
      />
    </SheetModal>
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
      paddingBottom: spacing.section * 3,
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
    weekHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.xs,
    },
    weekTitle: {
      ...type.item,
      color: colors.foreground,
      textAlign: "center",
    },
    todayJump: {
      ...type.micro,
      color: colors.rust,
      textAlign: "center",
      textTransform: "uppercase",
    },
    iconBtn: {
      width: spacing.touch,
      height: spacing.touch,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: spacing.hairline,
      borderColor: colors.border,
    },
    dayStrip: {
      gap: spacing.xs,
    },
    dayTile: {
      width: spacing.touchLg,
      minHeight: spacing.tabBar,
      paddingVertical: spacing.xs,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: spacing.hairline,
      gap: spacing.xxs,
    },
    dayTileActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    dayTileInactive: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    dayLabelActive: {
      ...type.micro,
      color: colors.primaryForeground,
    },
    dayLabelInactive: {
      ...type.micro,
      color: colors.mutedForeground,
    },
    dayNumActive: {
      ...type.item,
      color: colors.primaryForeground,
    },
    dayNumInactive: {
      ...type.item,
      color: colors.foreground,
    },
    dayCountActive: {
      ...type.xs,
      color: colors.primaryForeground,
    },
    dayCountInactive: {
      ...type.xs,
      color: colors.mutedForeground,
    },
    rowBetween: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    rowLeft: {
      flex: 1,
      flexDirection: "row",
      gap: spacing.sm,
    },
    kindBar: {
      width: spacing.xxs,
      alignSelf: "stretch",
    },
    entryBody: {
      flex: 1,
      gap: spacing.xxs,
    },
    microLabel: {
      ...type.micro,
      color: colors.rust,
      textTransform: "uppercase",
    },
    entryTime: {
      ...type.item,
      color: colors.foreground,
    },
    entryCustomer: {
      ...type.xs,
      color: colors.mutedForeground,
    },
    entryRef: {
      ...type.micro,
      color: colors.mutedForeground,
    },
    actionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    hourGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    hourCell: {
      minWidth: spacing.scanCircle / 2,
      minHeight: spacing.touch,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderWidth: spacing.hairline,
      alignItems: "center",
      justifyContent: "center",
    },
    hourOpen: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    hourClosed: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    hourBooked: {
      backgroundColor: colors.rust,
      borderColor: colors.rust,
    },
    hourTextDark: {
      ...type.xsBold,
      color: colors.foreground,
    },
    hourTextLight: {
      ...type.xsBold,
      color: colors.primaryForeground,
    },
    hourSubDark: {
      ...type.micro,
      color: colors.mutedForeground,
    },
    hourSubLight: {
      ...type.micro,
      color: colors.primaryForeground,
    },
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
    totalFigure: {
      ...type.figure,
      color: colors.foreground,
      marginTop: spacing.xs,
    },
    modalActions: {
      gap: spacing.sm,
    },
    halfField: {
      flex: 1,
    },
  });
}
