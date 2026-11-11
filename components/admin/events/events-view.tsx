"use client";

import { DotsThreeIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { StatusActions } from "../quads/status-actions";
import { BookingStatusBadge, PaymentBadge } from "../status-badge";
import { DeleteEventDialog } from "./delete-event-dialog";
import { EventDialog } from "./event-dialog";
import { CategoryTag } from "@/components/events/category-tag";
import { formatDay, formatEur } from "@/lib/admin/format";
import type { ManagedEvent } from "@/lib/admin/types";
import { dateKey } from "@/lib/sauna";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Editing = { mode: "new" } | { mode: "edit"; event: ManagedEvent } | null;

/** Events list: publish toggle, sales, edit and delete. */
export function EventsView() {
  const { events, eventTickets, setEventPublished, setTourTicketStatus } = useAdmin();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<ManagedEvent | null>(null);
  const today = dateKey(new Date());
  const upcoming = events.filter((e) => e.date >= today);
  const tickets = eventTickets.toSorted(
    (a, b) => Number(b.status === "laukia") - Number(a.status === "laukia") || `${a.eventDate}${a.eventTime}`.localeCompare(`${b.eventDate}${b.eventTime}`),
  );

  async function togglePublished(e: ManagedEvent) {
    const result = await setEventPublished(e.id, !e.published);
    if ("data" in result) toast.success(e.published ? "Paslėpta" : "Paskelbta");
  }

  return (
    <AdminPage
      title="Renginiai"
      description="Renginiai ir viešos pirties sesijos. Paskelbti renginiai rodomi puslapyje /renginiai."
      actions={
        <Button onClick={() => setEditing({ mode: "new" })}>
          <PlusIcon size={18} /> Naujas renginys
        </Button>
      }
    >
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Renginys</TableHead>
              <TableHead className="hidden xl:table-cell">Kategorija</TableHead>
              <TableHead className="hidden xl:table-cell">Vietos</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Kaina</TableHead>
              <TableHead className="hidden sm:table-cell">Rodomas</TableHead>
              <TableHead className="w-12"><span className="sr-only">Veiksmai</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {upcoming.map((e) => (
              <TableRow key={e.id}>
                <TableCell>
                  <p className="font-normal">{formatDay(e.date)}</p>
                  <p className="text-xs text-muted-foreground">{e.time}</p>
                </TableCell>
                <TableCell className="max-w-40 sm:max-w-none">
                  <p className="truncate font-medium">{e.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{e.place}</p>
                  {!e.published ? <Badge variant="outline" className={e.calendarPrivate ? "mt-1" : "mt-1 sm:hidden"}>{e.calendarPrivate ? "Privatus" : "Paslėptas"}</Badge> : null}
                </TableCell>
                <TableCell className="hidden xl:table-cell"><CategoryTag category={e.category} /></TableCell>
                <TableCell className="hidden xl:table-cell">
                  {e.capacity ? (
                    <div className="w-28">
                      <p className="text-xs tabular-nums">{e.sold} / {e.capacity}</p>
                      <progress
                        value={e.sold}
                        max={e.capacity}
                        aria-label={`Parduota ${e.sold} iš ${e.capacity}`}
                        className="mt-1 block h-1.5 w-full appearance-none [&::-moz-progress-bar]:bg-ink [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-ink"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Neribota</span>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-right tabular-nums">{e.price === null ? "Nemok." : formatEur(e.price)}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Switch
                    checked={e.published}
                    disabled={e.calendarPrivate}
                    aria-label={`Rodyti „${e.title}“ svetainėje`}
                    onCheckedChange={() => togglePublished(e)}
                  />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Veiksmai: ${e.title}`}>
                        <DotsThreeIcon size={20} weight="bold" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setEditing({ mode: "edit", event: e })}>Redaguoti</DropdownMenuItem>
                      <DropdownMenuItem className="sm:hidden" disabled={e.calendarPrivate} onSelect={() => togglePublished(e)}>
                        {e.published ? "Paslėpti" : "Paskelbti"}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onSelect={() => setDeleting(e)}>
                        Ištrinti
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <section className="space-y-4">
        <h2 className="font-display text-figure font-bold">Bilietai ir registracijos</h2>
        <p className="text-sm text-muted-foreground">
          Vietos į viešas pirties sesijas ir kitus renginius su limitu. Registracijos į renginius be limito atsiranda skyriuje Užklausos.
        </p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tickets.map((t) => (
            <Card key={t.id} className="h-full gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{t.eventTitle}</p>
                <div className="flex flex-wrap justify-end gap-1">
                  <BookingStatusBadge status={t.status} />
                  <PaymentBadge payment={t.payment} />
                </div>
              </div>
              <p className="text-sm">
                {formatDay(t.eventDate)} · {t.eventTime}
              </p>
              <p className="text-sm">
                <span className="font-display text-figure font-bold">{t.people}</span> asm. · {formatEur(t.total)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.customer.name} · {t.customer.phone || t.customer.email} · {t.reference}
              </p>
              <StatusActions status={t.status} onSet={(s) => setTourTicketStatus(t.id, s)} />
            </Card>
          ))}
        </div>
        {tickets.length === 0 ? <p className="text-sm text-muted-foreground">Bilietų dar nėra.</p> : null}
      </section>

      {editing ? (
        <EventDialog
          key={editing.mode === "edit" ? editing.event.id : "new"}
          open
          event={editing.mode === "edit" ? editing.event : undefined}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      ) : null}
      <DeleteEventDialog event={deleting} onOpenChange={(o) => !o && setDeleting(null)} />
    </AdminPage>
  );
}
