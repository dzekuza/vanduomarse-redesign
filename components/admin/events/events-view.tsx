"use client";

import { DotsThreeIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { EventSheet } from "../calendar/event-sheet";
import { DeleteEventDialog } from "./delete-event-dialog";
import { DeleteEventsDialog } from "./delete-events-dialog";
import { EventDialog } from "./event-dialog";
import { CategoryTag } from "@/components/events/category-tag";
import { formatDay, formatEur } from "@/lib/admin/format";
import type { ManagedEvent } from "@/lib/admin/types";
import { dateKey } from "@/lib/sauna";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/** Controls inside a clickable row must not also open the row. */
const stop = (e: React.MouseEvent) => e.stopPropagation();

type Editing = { mode: "new" } | { mode: "edit"; event: ManagedEvent } | null;

/** Events list: publish toggle, sales, edit, delete and bulk delete; a row opens the event's details and bookings. */
export function EventsView() {
  const { events, setEventPublished } = useAdmin();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<ManagedEvent | null>(null);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const today = dateKey(new Date());
  const upcoming = events.filter((e) => e.date >= today);

  const selectedEvents = upcoming.filter((e) => selected.has(e.id));
  const allSelected = upcoming.length > 0 && selectedEvents.length === upcoming.length;

  function toggleOne(id: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

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
      {selectedEvents.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted px-4 py-2">
          <p className="text-sm">Pasirinkta: {selectedEvents.length}</p>
          <div className="flex gap-2">
            <Button variant="outline" className="min-h-11" onClick={() => setSelected(new Set())}>
              Atšaukti
            </Button>
            <Button variant="destructive" className="min-h-11" onClick={() => setBulkDeleting(true)}>
              Ištrinti pasirinktus
            </Button>
          </div>
        </div>
      ) : null}
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected ? true : selectedEvents.length > 0 ? "indeterminate" : false}
                  onCheckedChange={(on) => setSelected(on === true ? new Set(upcoming.map((e) => e.id)) : new Set())}
                  aria-label="Pasirinkti visus renginius"
                />
              </TableHead>
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
              <TableRow key={e.id} data-state={selected.has(e.id) ? "selected" : undefined} className="cursor-pointer" onClick={() => setOpenId(e.id)}>
                <TableCell onClick={stop}>
                  <Checkbox
                    checked={selected.has(e.id)}
                    onCheckedChange={(on) => toggleOne(e.id, on === true)}
                    aria-label={`Pasirinkti „${e.title}“`}
                  />
                </TableCell>
                <TableCell>
                  <p className="font-normal">{formatDay(e.date)}</p>
                  <p className="text-xs text-muted-foreground">{e.time}</p>
                </TableCell>
                <TableCell className="max-w-40 sm:max-w-none">
                  <button type="button" className="block max-w-full truncate text-left font-medium focus-visible:underline focus-visible:outline-none" onClick={(ev) => { ev.stopPropagation(); setOpenId(e.id); }}>
                    {e.title}
                  </button>
                  <p className="truncate text-xs text-muted-foreground">{e.place}</p>
                  {!e.published ? <Badge variant="outline" className={e.calendarPrivate ? "mt-1" : "mt-1 sm:hidden"}>{e.calendarPrivate ? "Privatus" : "Paslėptas"}</Badge> : null}
                </TableCell>
                <TableCell className="hidden xl:table-cell"><CategoryTag category={e.category} /></TableCell>
                <TableCell className="hidden xl:table-cell">
                  {e.capacity ? (
                    <div className="w-28">
                      <p className="text-xs tabular-nums">{e.sold + e.held} / {e.capacity}</p>
                      <progress
                        value={e.sold + e.held}
                        max={e.capacity}
                        aria-label={`Užimta ${e.sold + e.held} iš ${e.capacity}`}
                        className="mt-1 block h-1.5 w-full appearance-none [&::-moz-progress-bar]:bg-ink [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-ink"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Neribota</span>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-right tabular-nums">{e.price === null ? "Nemok." : formatEur(e.price)}</TableCell>
                <TableCell className="hidden sm:table-cell" onClick={stop}>
                  <Switch
                    checked={e.published}
                    disabled={e.calendarPrivate}
                    aria-label={`Rodyti „${e.title}“ svetainėje`}
                    onCheckedChange={() => togglePublished(e)}
                  />
                </TableCell>
                <TableCell onClick={stop}>
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

      <EventSheet
        event={events.find((e) => e.id === openId) ?? null}
        onOpenChange={(o) => !o && setOpenId(null)}
        onEdit={(event) => {
          setOpenId(null);
          setEditing({ mode: "edit", event });
        }}
      />
      {editing ? (
        <EventDialog
          key={editing.mode === "edit" ? editing.event.id : "new"}
          open
          event={editing.mode === "edit" ? editing.event : undefined}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      ) : null}
      <DeleteEventsDialog
        events={bulkDeleting ? selectedEvents : []}
        onOpenChange={(o) => !o && setBulkDeleting(false)}
        onDeleted={() => setSelected(new Set())}
      />
      <DeleteEventDialog event={deleting} onOpenChange={(o) => !o && setDeleting(null)} />
    </AdminPage>
  );
}
