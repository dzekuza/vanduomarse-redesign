"use client";

import { EnvelopeSimpleIcon, PhoneIcon } from "@phosphor-icons/react";
import { useAdmin } from "../admin-store";
import { PaymentNote } from "../payment-note";
import { BookingStatusBadge, PaymentBadge } from "../status-badge";
import { StatusActions } from "./status-actions";
import { formatDateTime, formatDay, quadRentalLabel } from "@/lib/admin/format";
import { BOOKING_SOURCE } from "@/lib/admin/labels";
import type { QuadRental } from "@/lib/admin/types";
import { useCancelRequest } from "@/components/admin/use-cancel-request";
import { hourLabel } from "@/lib/quads";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface RentalSheetProps {
  rental: QuadRental | null;
  onOpenChange: (open: boolean) => void;
}

/** Rental details with contact links and the status actions. */
export function RentalSheet({ rental, onOpenChange }: RentalSheetProps) {
  const { quadTypes, setRentalStatus } = useAdmin();
  const { cancel, dialog: cancelDialog } = useCancelRequest("rental");
  return (
    <Sheet open={!!rental} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {rental ? (
          <>
            <SheetHeader>
              <SheetTitle className="wrap-anywhere">
                {quadRentalLabel(rental, quadTypes)}
              </SheetTitle>
              <SheetDescription>
                {rental.reference} · {BOOKING_SOURCE[rental.source]} · {formatDateTime(rental.createdAt)}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 px-4 pb-6">
              <div className="flex flex-wrap gap-1">
                <BookingStatusBadge status={rental.status} />
                <PaymentBadge payment={rental.payment} />
              </div>
              <PaymentNote payment={rental.payment} />
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ["Data", formatDay(rental.date)],
                  ["Laikas", `${hourLabel(rental.startHour)}–${hourLabel(rental.startHour + rental.hours)}`],
                  ["Važiuotojai", String(rental.riders)],
                  ["Suma", `${rental.total} €`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="mt-0.5 font-normal">{v}</dd>
                  </div>
                ))}
              </dl>
              {rental.note ? <blockquote className="border-l-2 border-rust pl-3 text-sm">{rental.note}</blockquote> : null}
              <div className="space-y-1 border-t pt-4 text-sm">
                <p className="font-medium">{rental.customer.name}</p>
                {rental.customer.phone ? (
                  <a href={`tel:${rental.customer.phone.replace(/\s/g, "")}`} className="flex min-h-11 items-center gap-2 hover:text-rust">
                    <PhoneIcon size={18} /> {rental.customer.phone}
                  </a>
                ) : null}
                {rental.customer.email ? (
                  <a
                    href={`mailto:${rental.customer.email}?subject=${encodeURIComponent(`Keturračių nuoma ${rental.reference}`)}`}
                    className="flex min-h-11 items-center gap-2 hover:text-rust"
                  >
                    <EnvelopeSimpleIcon size={18} /> {rental.customer.email}
                  </a>
                ) : null}
              </div>
              <div className="border-t pt-4">
                <StatusActions status={rental.status} onSet={(s) => setRentalStatus(rental.id, s)} onCancel={() => cancel({ id: rental.id, reference: rental.reference, total: rental.total, payment: rental.payment })} />
                {cancelDialog}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
