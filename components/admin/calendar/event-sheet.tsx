"use client";

import { useAdmin } from "../admin-store";
import { CustomerLink } from "../customer-link";
import { StatusActions } from "../quads/status-actions";
import { BookingStatusBadge, PaymentBadge } from "../status-badge";
import { seatsLabel, ticketsFor } from "@/lib/admin/calendar-entries";
import { formatDay, formatEur } from "@/lib/admin/format";
import type { ManagedEvent } from "@/lib/admin/types";
import { EVENT_CATEGORIES } from "@/lib/park-events";
import { useCancelRequest } from "@/components/admin/use-cancel-request";
import { useDeleteRequest } from "@/components/admin/use-delete-request";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

/** An event with the bookings (tickets) made for it. */
export function EventSheet({ event, onOpenChange, onEdit }: { event: ManagedEvent | null; onOpenChange: (open: boolean) => void; onEdit: (event: ManagedEvent) => void }) {
  const { tourTickets, eventTickets, setTourTicketStatus, quadRentals, setRentalStatus } = useAdmin();
  const { cancel: cancelRental, dialog: rentalDialog } = useCancelRequest("rental");
  const { cancel: cancelTicket, dialog: ticketDialog } = useCancelRequest("ticket");
  const { remove: removeRental, dialog: removeRentalDialog } = useDeleteRequest("rental");
  const { remove: removeTicket, dialog: removeTicketDialog } = useDeleteRequest("ticket");
  const tickets = event ? ticketsFor(event.id, tourTickets, eventTickets) : [];
  // Bookings of a quad tour departure are quad rentals joined to the event.
  const rentals = event ? quadRentals.filter((r) => r.tourEventId === event.id) : [];
  const active = tickets.filter((t) => t.status !== "atsaukta");
  const people = active.reduce((sum, t) => sum + t.people, 0);
  const quads = rentals.filter((r) => r.status !== "atsaukta").reduce((sum, r) => sum + r.units, 0);
  const category = EVENT_CATEGORIES.find((c) => c.id === event?.category)?.label;
  const seats = event ? (event.tourRouteId ? `Keturračiai: ${event.capacity ? `${quads}/${event.capacity}` : quads}` : event.capacity ? `Vietos: ${seatsLabel(event)}` : `Registracijų: ${people} asm.`) : "";

  return (
    <Sheet open={!!event} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {event ? (
          <>
            <SheetHeader>
              <SheetTitle className="wrap-anywhere">{event.title}</SheetTitle>
              <SheetDescription>
                {[category, formatDay(event.date), event.time, event.place, seats, event.price === null ? "Nemokamai" : formatEur(event.price), event.published ? null : "Paslėptas"].filter(Boolean).join(" · ")}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-4 pb-6">
              <Button variant="outline" size="sm" className="min-h-11" onClick={() => onEdit(event)}>
                Redaguoti renginį
              </Button>
              <section className="space-y-3">
                <h3 className="text-sm font-medium">Rezervacijos ({tickets.length + rentals.length})</h3>
                {tickets.length + rentals.length === 0 ? <p className="text-sm text-muted-foreground">Rezervacijų dar nėra.</p> : null}
                {rentals.map((r) => (
                  <div key={r.id} className="space-y-2 border p-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-1">
                        <BookingStatusBadge status={r.status} />
                        <PaymentBadge payment={r.payment} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          <CustomerLink name={r.customer.name} riderId={r.riderId} phone={r.customer.phone} email={r.customer.email} />
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {r.units} keturr. · {formatEur(r.total)} · {r.reference}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 text-xs">
                      {r.customer.phone ? (
                        <a href={`tel:${r.customer.phone}`} className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-rust">
                          {r.customer.phone}
                        </a>
                      ) : null}
                      {r.customer.email ? (
                        <a href={`mailto:${r.customer.email}`} className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-rust">
                          {r.customer.email}
                        </a>
                      ) : null}
                    </div>
                    <StatusActions status={r.status} onSet={(s) => setRentalStatus(r.id, s)} onCancel={() => cancelRental({ id: r.id, reference: r.reference, total: r.total, payment: r.payment })} onDelete={() => removeRental({ id: r.id, reference: r.reference })} />
                  </div>
                ))}
                {tickets.map((t) => (
                  <div key={t.id} className="space-y-2 border p-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-1">
                        <BookingStatusBadge status={t.status} />
                        <PaymentBadge payment={t.payment} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          <CustomerLink name={t.customer.name} riderId={t.riderId} phone={t.customer.phone} email={t.customer.email} />
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {t.people} asm. · {formatEur(t.total)} · {t.reference}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 text-xs">
                      {t.customer.phone ? (
                        <a href={`tel:${t.customer.phone}`} className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-rust">
                          {t.customer.phone}
                        </a>
                      ) : null}
                      {t.customer.email ? (
                        <a href={`mailto:${t.customer.email}`} className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-rust">
                          {t.customer.email}
                        </a>
                      ) : null}
                    </div>
                    <StatusActions status={t.status} onSet={(s) => setTourTicketStatus(t.id, s)} onCancel={() => cancelTicket({ id: t.id, reference: t.reference, total: t.total, payment: t.payment })} onDelete={() => removeTicket({ id: t.id, reference: t.reference })} />
                  </div>
                ))}
              </section>
            </div>
          </>
        ) : null}
        {rentalDialog}
        {ticketDialog}
        {removeRentalDialog}
        {removeTicketDialog}
      </SheetContent>
    </Sheet>
  );
}
