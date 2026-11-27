"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAdmin } from "../admin-store";
import { BookingSheet } from "../bookings/booking-sheet";
import { NewBookingDialog } from "../bookings/new-booking-dialog";
import { EventSheet } from "../calendar/event-sheet";
import { PassSheet } from "../apyrankes/pass-sheet";
import { CouponSheet } from "../coupons/coupon-sheet";
import { EventDialog } from "../events/event-dialog";
import { RentalSheet } from "../quads/rental-sheet";
import { SpaceBookingSheet } from "../spaces/space-booking-sheet";
import type { Sale } from "@/lib/admin/sales";
import type { ManagedEvent } from "@/lib/admin/types";

/**
 * What a click on a sale opens (`Sale["target"]`): a booking, rental, coupon, online pass or event details panel in place, or the
 * page that manages it. Render `sheets` once next to the list that calls `openSale`. Shared by the Apžvalga sales
 * table and the customer's Pirkimai tab.
 */
export function useSaleDetails(): { openSale: (target: Sale["target"]) => void; sheets: ReactNode } {
  const { bookings, quadRentals, coupons, events, spaceBookings, planPasses } = useAdmin();
  const router = useRouter();
  const [open, setOpen] = useState<Extract<Sale["target"], { id: string }> | null>(null);
  const [editingEvent, setEditingEvent] = useState<ManagedEvent | null>(null);
  const [ticketEventId, setTicketEventId] = useState<string | null>(null);

  const openSale = (target: Sale["target"]) => (target.kind === "link" ? router.push(target.href) : setOpen(target));
  const close = (isOpen: boolean) => !isOpen && setOpen(null);

  const sheets = (
    <>
      <BookingSheet booking={open?.kind === "booking" ? (bookings.find((b) => b.id === open.id) ?? null) : null} onOpenChange={close} />
      <RentalSheet rental={open?.kind === "rental" ? (quadRentals.find((q) => q.id === open.id) ?? null) : null} onOpenChange={close} />
      <EventSheet
        event={open?.kind === "event" ? (events.find((e) => e.id === open.id) ?? null) : null}
        onOpenChange={close}
        onEdit={(event) => {
          setOpen(null);
          setEditingEvent(event);
        }}
        onAddTicket={(event) => {
          setOpen(null);
          setTicketEventId(event.id);
        }}
      />
      {editingEvent ? <EventDialog key={editingEvent.id} open event={editingEvent} onOpenChange={(o) => !o && setEditingEvent(null)} /> : null}
      {ticketEventId ? (
        <NewBookingDialog initial={{ eventId: ticketEventId }} onOpenChange={(o) => !o && setTicketEventId(null)} onCreated={() => setTicketEventId(null)} />
      ) : null}
      <SpaceBookingSheet booking={open?.kind === "space" ? (spaceBookings.find((s) => s.id === open.id) ?? null) : null} onOpenChange={close} />
      <CouponSheet coupon={open?.kind === "coupon" ? (coupons.find((c) => c.id === open.id) ?? null) : null} onOpenChange={close} />
      <PassSheet pass={open?.kind === "pass" ? (planPasses.find((p) => p.id === open.id) ?? null) : null} onOpenChange={close} />
    </>
  );

  return { openSale, sheets };
}
