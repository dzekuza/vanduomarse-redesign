"use client";

import { DownloadSimpleIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { BookingStatusBadge } from "../status-badge";
import { BookingActions } from "./booking-actions";
import { BookingFilters, type BookingFilterState } from "./booking-filters";
import { BookingSheet } from "./booking-sheet";
import { NewBookingDialog } from "./new-booking-dialog";
import { BOOKING_KIND, BOOKING_SOURCE } from "@/lib/admin/labels";
import { bookingsToCsv, exportFileName } from "@/lib/admin/export";
import { bookingWhen, formatDay, formatEur } from "@/lib/admin/format";
import { downloadText } from "@/lib/download";
import { dateKey } from "@/lib/sauna";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const INITIAL: BookingFilterState = { kind: "visos", status: "visos", when: "busimos", query: "" };

/** Bookings list with filters; a row opens the details sheet. */
export function BookingsView() {
  const { bookings } = useAdmin();
  const [filters, setFilters] = useState(INITIAL);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const today = dateKey(new Date());
  const q = filters.query.trim().toLowerCase();

  const rows = bookings
    .filter((b) => filters.kind === "visos" || (filters.kind === "pirtis" ? b.kind === "pirtis" : b.kind !== "pirtis"))
    .filter((b) => filters.status === "visos" || b.status === filters.status)
    .filter((b) => filters.when === "visos" || (filters.when === "busimos" ? b.date >= today : b.date < today))
    .filter((b) => !q || [b.customer.name, b.customer.email, b.reference].some((f) => f.toLowerCase().includes(q)))
    .sort((a, b) => {
      const order = (a.date + String(a.startHour ?? 0).padStart(2, "0")).localeCompare(b.date + String(b.startHour ?? 0).padStart(2, "0"));
      return filters.when === "praejusios" ? -order : order;
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
      <BookingFilters value={filters} onChange={setFilters} />
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Klientas</TableHead>
              <TableHead className="hidden md:table-cell">Tipas</TableHead>
              <TableHead className="hidden lg:table-cell">Svečiai</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Suma</TableHead>
              <TableHead>Būsena</TableHead>
              <TableHead className="hidden w-12 sm:table-cell"><span className="sr-only">Veiksmai</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((b) => (
              <TableRow key={b.id} onClick={() => setOpenId(b.id)} className="cursor-pointer">
                <TableCell>
                  <p className="font-medium">{formatDay(b.date)}</p>
                  <p className="text-xs text-muted-foreground">{bookingWhen(b)}</p>
                </TableCell>
                <TableCell className="max-w-32 sm:max-w-none">
                  <p className="truncate">{b.customer.name}</p>
                  <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    {b.reference}
                    {b.source && b.source !== "svetaine" ? (
                      <Badge variant="outline" className="px-1.5 py-0 text-xs">
                        {b.source === "telefonu" ? "Tel." : BOOKING_SOURCE[b.source]}
                      </Badge>
                    ) : null}
                  </p>
                </TableCell>
                <TableCell className="hidden md:table-cell">{BOOKING_KIND[b.kind]}</TableCell>
                <TableCell className="hidden lg:table-cell">{b.guests}</TableCell>
                <TableCell className="hidden sm:table-cell text-right tabular-nums">{formatEur(b.total)}</TableCell>
                <TableCell><BookingStatusBadge status={b.status} /></TableCell>
                <TableCell className="hidden sm:table-cell"><BookingActions booking={b} /></TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Rezervacijų pagal filtrus nėra.</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
      <p className="text-sm text-muted-foreground">Rodoma: {rows.length}</p>
      <BookingSheet booking={bookings.find((b) => b.id === openId) ?? null} onOpenChange={(o) => !o && setOpenId(null)} />
      {creating ? <NewBookingDialog onOpenChange={setCreating} onCreated={setOpenId} /> : null}
    </AdminPage>
  );
}
