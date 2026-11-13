"use client";

import { DownloadSimpleIcon, PlusIcon } from "@phosphor-icons/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SortableHead, type SortState } from "../sortable-head";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { BookingStatusBadge, PaymentBadge } from "../status-badge";
import { BookingActions } from "./booking-actions";
import { BookingCalendarTab } from "./booking-calendar-tab";
import { BookingFilters, type BookingFilterState } from "./booking-filters";
import { BookingSheet } from "./booking-sheet";
import { BookedOnCell } from "./booked-on-cell";
import { SessionTicketRow } from "./session-ticket-row";
import { EventSheet } from "../calendar/event-sheet";
import { EventDialog } from "../events/event-dialog";
import { NewBookingDialog } from "./new-booking-dialog";
import { BOOKING_SOURCE } from "@/lib/admin/labels";
import type { ManagedEvent } from "@/lib/admin/types";
import { bookingsToCsv, exportFileName } from "@/lib/admin/export";
import { bookingTypeLabel, bookingWhen, formatDay, formatEur } from "@/lib/admin/format";
import { downloadText } from "@/lib/download";
import { dateKey } from "@/lib/sauna";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerLink } from "../customer-link";

const INITIAL: BookingFilterState = { kind: "visos", status: "visos", when: "busimos", query: "" };
type SortKey = "data" | "klientas" | "rezervuota" | "tipas" | "sveciai" | "suma" | "busena";
const STATUS_ORDER = ["laukia", "patvirtinta", "ivykdyta", "atsaukta"] as const;
const TAB_IDS = ["sarasas", "kalendorius"] as const;

/** Bookings list with filters; a row opens the details sheet. */
export function BookingsView() {
  const { bookings, stayTypes, eventTickets, events } = useAdmin();
  const [sort, setSort] = useState<SortState<SortKey> | null>(null);
  const [openEventId, setOpenEventId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<ManagedEvent | null>(null);
  const [filters, setFilters] = useState(INITIAL);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  // `?nauja=1` comes from the header button and the tab bar's centre "+".
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromLink = searchParams.get("nauja") === "1";
  const requestedTab = searchParams.get("view");
  const initialTab = (TAB_IDS as readonly string[]).includes(requestedTab ?? "") ? requestedTab! : "sarasas";
  const newOpen = creating || fromLink;
  const setNewOpen = (open: boolean) => {
    setCreating(open);
    if (!open && fromLink) router.replace(pathname, { scroll: false });
  };
  const today = dateKey(new Date());
  const q = filters.query.trim().toLowerCase();

  const rows = bookings
    .filter((b) => filters.kind === "visos" || (filters.kind === "pirtis" ? b.kind === "pirtis" : b.kind !== "pirtis"))
    .filter((b) => filters.status === "visos" || b.status === filters.status)
    .filter((b) => filters.when === "visos" || (filters.when === "busimos" ? b.date >= today : b.date < today))
    .filter((b) => !q || [b.customer.name, b.customer.email, b.reference].some((f) => f.toLowerCase().includes(q)));
  // Tickets for public sauna sessions are Pirtis too; they live in their own table, so they join the list here.
  const sessionIds = new Set(events.filter((e) => e.category === "pirtis").map((e) => e.id));
  const tickets = filters.kind === "nakvyne" ? [] : eventTickets
    .filter((t) => sessionIds.has(t.eventId))
    .filter((t) => filters.status === "visos" || t.status === filters.status)
    .filter((t) => filters.when === "visos" || (filters.when === "busimos" ? t.eventDate >= today : t.eventDate < today))
    .filter((t) => !q || [t.customer.name, t.customer.email, t.reference].some((f) => f.toLowerCase().includes(q)));
  const entries = [
    ...rows.map((booking) => ({ booking, ticket: null, sort: booking.date + String(booking.startHour ?? 0).padStart(2, "0"), name: booking.customer.name, created: booking.createdAt, type: bookingTypeLabel(booking, stayTypes), guests: booking.guests ?? 0, total: booking.total, status: booking.status })),
    ...tickets.map((ticket) => ({ booking: null, ticket, sort: ticket.eventDate + ticket.eventTime.slice(0, 2), name: ticket.customer.name, created: ticket.createdAt, type: "Pirties seansas", guests: ticket.people, total: ticket.total, status: ticket.status })),
  ];
  const byColumn: Record<SortKey, (a: (typeof entries)[number], b: (typeof entries)[number]) => number> = {
    data: (a, b) => a.sort.localeCompare(b.sort),
    klientas: (a, b) => a.name.localeCompare(b.name, "lt"),
    rezervuota: (a, b) => a.created.localeCompare(b.created),
    tipas: (a, b) => a.type.localeCompare(b.type, "lt"),
    sveciai: (a, b) => a.guests - b.guests,
    suma: (a, b) => a.total - b.total,
    busena: (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
  };
  // No column chosen: by service date, newest first for past bookings.
  const list = entries.sort((a, b) => {
    if (!sort) return filters.when === "praejusios" ? b.sort.localeCompare(a.sort) : a.sort.localeCompare(b.sort);
    const order = byColumn[sort.key](a, b);
    return sort.direction === "asc" ? order : -order;
  });

  return (
    <AdminPage
      title="Rezervacijos"
      description="Pirties seansai, nameliai ir kemperių aikštelės."
      actions={
        <>
          <Button
            variant="outline"
            disabled={rows.length === 0}
            onClick={() => downloadText(bookingsToCsv(rows), exportFileName("rezervacijos", today))}
          >
            <DownloadSimpleIcon size={18} /> Eksportuoti
          </Button>
          <Button onClick={() => setCreating(true)}>
            <PlusIcon size={18} /> Nauja rezervacija
          </Button>
        </>
      }
    >
      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="sarasas" className="min-h-11">
            Sąrašas
          </TabsTrigger>
          <TabsTrigger value="kalendorius" className="min-h-11">
            Kalendorius
          </TabsTrigger>
        </TabsList>
        <TabsContent value="sarasas" className="mt-6 space-y-4">
          <BookingFilters value={filters} onChange={setFilters} />
          <Card className="py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead sortKey="data" sort={sort} onSort={setSort}>Data</SortableHead>
                  <SortableHead sortKey="klientas" sort={sort} onSort={setSort}>Klientas</SortableHead>
                  <SortableHead sortKey="rezervuota" sort={sort} onSort={setSort} className="hidden md:table-cell">Rezervuota</SortableHead>
                  <SortableHead sortKey="tipas" sort={sort} onSort={setSort} className="hidden md:table-cell">Tipas</SortableHead>
                  <SortableHead sortKey="sveciai" sort={sort} onSort={setSort} className="hidden lg:table-cell">Svečiai</SortableHead>
                  <SortableHead sortKey="suma" sort={sort} onSort={setSort} className="hidden sm:table-cell text-right">Suma</SortableHead>
                  <SortableHead sortKey="busena" sort={sort} onSort={setSort}>Būsena</SortableHead>
                  <TableHead className="hidden w-12 sm:table-cell"><span className="sr-only">Veiksmai</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map(({ booking: b, ticket }) => ticket ? <SessionTicketRow key={`t-${ticket.id}`} ticket={ticket} onOpen={() => setOpenEventId(ticket.eventId)} /> : b ? (
                  <TableRow key={b.id} onClick={() => setOpenId(b.id)} className="cursor-pointer">
                    <TableCell>
                      <p className="font-normal">{formatDay(b.date)}</p>
                      <p className="text-xs text-muted-foreground">{bookingWhen(b)}</p>
                    </TableCell>
                    <TableCell className="max-w-32 sm:max-w-none">
                      <p className="truncate">
                        <CustomerLink name={b.customer.name} riderId={b.riderId} phone={b.customer.phone} email={b.customer.email} />
                      </p>
                      <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                        {b.reference}
                        {b.source && b.source !== "svetaine" ? (
                          <Badge variant="outline" className="px-1.5 py-0 text-xs">
                            {b.source === "telefonu" ? "Tel." : BOOKING_SOURCE[b.source]}
                          </Badge>
                        ) : null}
                      </p>
                    </TableCell>
                    <BookedOnCell createdAt={b.createdAt} payment={b.payment} />
                    <TableCell className="hidden md:table-cell">{bookingTypeLabel(b, stayTypes)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{b.guests ?? "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell text-right tabular-nums">{formatEur(b.total)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <BookingStatusBadge status={b.status} />
                        <PaymentBadge payment={b.payment} />
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell"><BookingActions booking={b} /></TableCell>
                  </TableRow>
                ) : null)}
                {list.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Rezervacijų pagal filtrus nėra.</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </Card>
          <p className="text-sm text-muted-foreground">Rodoma: {list.length}</p>
          <BookingSheet booking={bookings.find((b) => b.id === openId) ?? null} onOpenChange={(o) => !o && setOpenId(null)} />
          <EventSheet event={events.find((e) => e.id === openEventId) ?? null} onOpenChange={(o) => !o && setOpenEventId(null)} onEdit={(event) => { setOpenEventId(null); setEditingEvent(event); }} />
          {editingEvent ? <EventDialog key={editingEvent.id} open event={editingEvent} onOpenChange={(o) => !o && setEditingEvent(null)} /> : null}
          {newOpen ? <NewBookingDialog onOpenChange={setNewOpen} onCreated={setOpenId} /> : null}
        </TabsContent>
        <TabsContent value="kalendorius" className="mt-6">
          <BookingCalendarTab />
        </TabsContent>
      </Tabs>
    </AdminPage>
  );
}
