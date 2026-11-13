import { useMemo } from "react";
import type { AdminData } from "@/lib/admin/types";

/** Everything still waiting for staff ("laukia"), by kind, with the total for the tab badge. */
export function usePendingRequests(data: AdminData) {
  return useMemo(() => {
    const bookings = data.bookings.filter((b) => b.status === "laukia");
    const rentals = data.quadRentals.filter((r) => r.status === "laukia");
    const tickets = [...data.tourTickets, ...data.eventTickets].filter((t) => t.status === "laukia");
    return { bookings, rentals, tickets, total: bookings.length + rentals.length + tickets.length };
  }, [data.bookings, data.quadRentals, data.tourTickets, data.eventTickets]);
}
