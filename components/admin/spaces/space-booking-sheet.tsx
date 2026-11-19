"use client";

import { PhoneIcon } from "@phosphor-icons/react";
import { useAdmin } from "../admin-store";
import { BookingStatusBadge } from "../status-badge";
import { StatusActions } from "../quads/status-actions";
import { formatDay, formatEur } from "@/lib/admin/format";
import type { SpaceBooking } from "@/lib/admin/types";
import { spaceLabels } from "@/lib/space-booking";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface SpaceBookingSheetProps {
  booking: SpaceBooking | null;
  onOpenChange: (open: boolean) => void;
}

/** An event-space hire: the spaces, window, customer and price, with confirm / cancel. */
export function SpaceBookingSheet({ booking, onOpenChange }: SpaceBookingSheetProps) {
  const { setSpaceBookingStatus } = useAdmin();
  return (
    <Sheet open={!!booking} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {booking ? (
          <>
            <SheetHeader>
              <SheetTitle className="wrap-anywhere">{spaceLabels(booking.spaces)}</SheetTitle>
              <SheetDescription>Erdvių rezervacija</SheetDescription>
            </SheetHeader>
            <div className="space-y-6 px-4 pb-6">
              <BookingStatusBadge status={booking.status} />
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ["Nuo", `${formatDay(booking.date)} ${booking.startTime}`],
                  ["Iki", `${formatDay(booking.endDate)} ${booking.endTime}`],
                  ["Žmonių", String(booking.guests)],
                  ["Kaina", formatEur(booking.price)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="mt-0.5">{v}</dd>
                  </div>
                ))}
              </dl>
              {booking.note ? <blockquote className="border-l-2 border-rust pl-3 text-sm">{booking.note}</blockquote> : null}
              <div className="space-y-1 border-t pt-4 text-sm">
                <p className="font-medium">{[booking.customer.name, booking.customer.surname].filter(Boolean).join(" ")}</p>
                <a href={`tel:${booking.customer.phone.replace(/\s/g, "")}`} className="flex min-h-11 items-center gap-2 hover:text-rust">
                  <PhoneIcon size={18} /> {booking.customer.phone}
                </a>
                {booking.customer.email ? (
                  <a href={`mailto:${booking.customer.email}`} className="flex min-h-11 items-center gap-2 hover:text-rust">
                    {booking.customer.email}
                  </a>
                ) : null}
              </div>
              <div className="border-t pt-4">
                <StatusActions status={booking.status} onSet={(s) => setSpaceBookingStatus(booking.id, s)} />
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
