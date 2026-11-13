"use client";

import { DotsThreeIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { BOOKING_STATUS } from "@/lib/admin/labels";
import type { Booking, BookingStatus } from "@/lib/admin/types";
import { useCancelRequest } from "../use-cancel-request";
import { useDeleteRequest } from "../use-delete-request";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/** Which status changes make sense from each status. A cancelled booking stays cancelled (it may already be refunded). */
export const NEXT_STATUSES: Record<BookingStatus, BookingStatus[]> = {
  laukia: ["patvirtinta", "atsaukta"],
  patvirtinta: ["atsaukta"],
  ivykdyta: [],
  atsaukta: [],
};

export const ACTION_LABEL: Record<BookingStatus, string> = {
  laukia: "Grąžinti į laukiančias",
  patvirtinta: "Patvirtinti",
  ivykdyta: "Pažymėti įvykdyta",
  atsaukta: "Atšaukti",
};

/** Status changes; cancelling a booking paid online first asks whether to refund it (render `dialog` beside the button). */
export function useBookingStatus(onRemoved?: () => void) {
  const { setBookingStatus } = useAdmin();
  const { cancel, dialog: cancelDialog } = useCancelRequest("booking");
  const { remove, dialog: removeDialog } = useDeleteRequest("booking", onRemoved);
  const change = (booking: Booking, status: BookingStatus) => {
    if (status === "atsaukta") {
      void cancel({ id: booking.id, reference: booking.reference, total: booking.total, payment: booking.payment });
      return;
    }
    setBookingStatus(booking.id, status);
    toast.success(`${booking.reference}: ${BOOKING_STATUS[status].toLowerCase()}`);
  };
  const dialog = (
    <>
      {cancelDialog}
      {removeDialog}
    </>
  );
  return { change, remove: (booking: Booking) => remove({ id: booking.id, reference: booking.reference }), dialog };
}

/** Row menu with the allowed status transitions. */
export function BookingActions({ booking }: { booking: Booking }) {
  const { change, remove, dialog } = useBookingStatus();
  const next = NEXT_STATUSES[booking.status];
  const removable = booking.status === "atsaukta";
  if (!next.length && !removable) return null;
  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Veiksmai: ${booking.reference}`} onClick={(e) => e.stopPropagation()}>
          <DotsThreeIcon size={20} weight="bold" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {next.map((s) => (
          <DropdownMenuItem key={s} onSelect={() => change(booking, s)} className={s === "atsaukta" ? "text-destructive" : ""}>
            {ACTION_LABEL[s]}
          </DropdownMenuItem>
        ))}
        {removable ? (
          <DropdownMenuItem onSelect={() => remove(booking)} className="text-destructive">
            Pašalinti
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
    {/* The row opens the booking on click; keep clicks inside the dialog (React bubbles through its portal) from reaching it. */}
    <span onClick={(e) => e.stopPropagation()}>{dialog}</span>
    </>
  );
}
