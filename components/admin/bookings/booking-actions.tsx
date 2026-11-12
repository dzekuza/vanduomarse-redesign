"use client";

import { DotsThreeIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { BOOKING_STATUS } from "@/lib/admin/labels";
import type { Booking, BookingStatus } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/** Which status changes make sense from each status. */
export const NEXT_STATUSES: Record<BookingStatus, BookingStatus[]> = {
  laukia: ["patvirtinta", "atsaukta"],
  patvirtinta: ["atsaukta"],
  ivykdyta: [],
  atsaukta: ["laukia"],
};

export const ACTION_LABEL: Record<BookingStatus, string> = {
  laukia: "Grąžinti į laukiančias",
  patvirtinta: "Patvirtinti",
  ivykdyta: "Pažymėti įvykdyta",
  atsaukta: "Atšaukti",
};

export function useBookingStatus() {
  const { setBookingStatus } = useAdmin();
  return (booking: Booking, status: BookingStatus) => {
    setBookingStatus(booking.id, status);
    toast.success(`${booking.reference}: ${BOOKING_STATUS[status].toLowerCase()}`);
  };
}

/** Row menu with the allowed status transitions. */
export function BookingActions({ booking }: { booking: Booking }) {
  const change = useBookingStatus();
  const next = NEXT_STATUSES[booking.status];
  if (!next.length) return null;
  return (
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
