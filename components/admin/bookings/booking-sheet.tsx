"use client";

import { EnvelopeSimpleIcon, PhoneIcon } from "@phosphor-icons/react";
import { ACTION_LABEL, NEXT_STATUSES, useBookingStatus } from "./booking-actions";
import { useAdmin } from "../admin-store";
import { BookingStatusBadge } from "../status-badge";
import { BOOKING_KIND, BOOKING_SOURCE } from "@/lib/admin/labels";
import { bookingWhen, formatDateTime, formatDay, formatEur } from "@/lib/admin/format";
import type { Booking } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface BookingSheetProps {
  booking: Booking | null;
  onOpenChange: (open: boolean) => void;
}

/** Side panel with the full booking, contact shortcuts and status actions. */
export function BookingSheet({ booking, onOpenChange }: BookingSheetProps) {
  const change = useBookingStatus();
  const { saunas } = useAdmin();
  const saunaName = saunas.find((s) => s.id === booking?.saunaId)?.name;
  return (
    <Sheet open={!!booking} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        {booking ? (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-3">
                {booking.reference} <BookingStatusBadge status={booking.status} />
              </SheetTitle>
              <SheetDescription>Gauta {formatDateTime(booking.createdAt)}</SheetDescription>
            </SheetHeader>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 px-4 text-sm">
              {[
                ["Tipas", saunaName ?? BOOKING_KIND[booking.kind]],
                ["Data", formatDay(booking.date)],
                ["Laikas", bookingWhen(booking)],
                ["Svečiai", `${booking.guests} asm.`],
                ["Priedai", booking.extras.length ? booking.extras.join(", ") : "-"],
                ["Suma", formatEur(booking.total)],
                ["Šaltinis", BOOKING_SOURCE[booking.source ?? "svetaine"]],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="mt-0.5 font-normal">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mx-4 space-y-2 border-t pt-4 text-sm">
              <p className="font-normal">{booking.customer.name}</p>
              {booking.customer.email ? (
                <a href={`mailto:${booking.customer.email}`} className="flex min-h-11 items-center gap-2 hover:text-rust">
                  <EnvelopeSimpleIcon size={18} /> {booking.customer.email}
                </a>
              ) : null}
              <a href={`tel:${booking.customer.phone.replace(/\s/g, "")}`} className="flex min-h-11 items-center gap-2 hover:text-rust">
                <PhoneIcon size={18} /> {booking.customer.phone}
              </a>
            </div>
            {booking.note ? <blockquote className="mx-4 border-l-2 border-rust pl-3 text-sm">{booking.note}</blockquote> : null}
            <SheetFooter className="flex-col gap-2 sm:flex-col">
              {NEXT_STATUSES[booking.status].map((s) => (
                <Button key={s} variant={s === "atsaukta" ? "destructive" : s === "patvirtinta" ? "default" : "outline"} onClick={() => change(booking, s)}>
                  {ACTION_LABEL[s]}
                </Button>
              ))}
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
