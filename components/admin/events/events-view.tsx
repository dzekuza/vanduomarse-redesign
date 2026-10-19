"use client";

import { DotsThreeIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
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
  const { events, setEventPublished } = useAdmin();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<ManagedEvent | null>(null);
  const today = dateKey(new Date());
  const upcoming = events.filter((e) => e.date >= today);

  function togglePublished(e: ManagedEvent) {
    setEventPublished(e.id, !e.published);
    toast.success(e.published ? "Paslėpta" : "Paskelbta");
  }

  return (
    <AdminPage
      title="Renginiai"
      description="Renginiai ir viešos pirties sesijos. Prijungus duomenų bazę, jie bus rodomi puslapyje /renginiai."
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
                  <p className="font-medium">{formatDay(e.date)}</p>
                  <p className="text-xs text-muted-foreground">{e.time}</p>
                </TableCell>
                <TableCell className="max-w-40 sm:max-w-none">
                  <p className="truncate font-medium">{e.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{e.place}</p>
                  {!e.published ? <Badge variant="outline" className="mt-1 sm:hidden">Paslėptas</Badge> : null}
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
                      <DropdownMenuItem className="sm:hidden" onSelect={() => togglePublished(e)}>
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
