"use client";

import { BookingStatusBadge, PaymentBadge } from "../status-badge";
import { CustomerLink } from "../customer-link";
import { formatDay, formatEur } from "@/lib/admin/format";
import type { TourTicket } from "@/lib/admin/types";
import { TableCell, TableRow } from "@/components/ui/table";

/** A ticket for a public sauna session, as a row of the bookings list; opens the session's panel. */
export function SessionTicketRow({ ticket, onOpen }: { ticket: TourTicket; onOpen: () => void }) {
  return (
    <TableRow onClick={onOpen} className="cursor-pointer">
      <TableCell>
        <p className="font-normal">{formatDay(ticket.eventDate)}</p>
        <p className="text-xs text-muted-foreground">{ticket.eventTime}</p>
      </TableCell>
      <TableCell className="max-w-32 sm:max-w-none">
        <p className="truncate">
          <CustomerLink name={ticket.customer.name} riderId={ticket.riderId} phone={ticket.customer.phone} email={ticket.customer.email} />
        </p>
        <p className="truncate text-xs text-muted-foreground">{ticket.reference}</p>
      </TableCell>
      <TableCell className="hidden md:table-cell">Pirties seansas</TableCell>
      <TableCell className="hidden lg:table-cell">{ticket.people}</TableCell>
      <TableCell className="hidden sm:table-cell text-right tabular-nums">{formatEur(ticket.total)}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          <BookingStatusBadge status={ticket.status} />
          <PaymentBadge payment={ticket.payment} />
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell" />
    </TableRow>
  );
}
