"use client";

import { DotsThreeIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { DeleteEventDialog } from "./delete-event-dialog";
import { formatDay, formatEur } from "@/lib/admin/format";
import type { ManagedEvent } from "@/lib/admin/types";
import type { EventCategory } from "@/lib/park-events";
import { dateKey } from "@/lib/sauna";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

interface CategoryEventsListProps {
  category: EventCategory;
  emptyText: string;
  /** Extra detail after the price, e.g. the sauna program. */
  extra?: (event: ManagedEvent) => string | undefined;
  onEdit: (event: ManagedEvent) => void;
}

/** Upcoming events of one category (sauna sessions, quad tours) with publish switch, edit and delete. The parent owns the create/edit dialog. */
export function CategoryEventsList({ category, emptyText, extra, onEdit }: CategoryEventsListProps) {
  const { events, setEventPublished } = useAdmin();
  const [deleting, setDeleting] = useState<ManagedEvent | null>(null);
  const today = dateKey(new Date());
  const list = events
    .filter((e) => e.category === category && e.date >= today)
    .toSorted((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  async function togglePublished(e: ManagedEvent) {
    const result = await setEventPublished(e.id, !e.published);
    if ("data" in result) toast.success(e.published ? "Paslėpta" : "Paskelbta");
  }

  return (
    <div className="divide-y">
      {list.length === 0 ? <p className="py-3 text-sm text-muted-foreground">{emptyText}</p> : null}
      {list.map((e) => (
        <div key={e.id} className="flex items-center gap-3 py-3 first:pt-0">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{e.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {formatDay(e.date)} · {e.time}
              {e.durationMinutes ? ` · ${e.durationMinutes} min.` : ""}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {[extra?.(e), e.price === null ? "Nemok." : formatEur(e.price), e.capacity ? `${e.sold} / ${e.capacity} vietų` : "Vietos neribotos"].filter(Boolean).join(" · ")}
            </p>
            {!e.published ? (
              <Badge variant="outline" className="mt-1 sm:hidden">
                Paslėptas
              </Badge>
            ) : null}
          </div>
          <Switch checked={e.published} aria-label={`Rodyti „${e.title}“ svetainėje`} onCheckedChange={() => togglePublished(e)} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Veiksmai: ${e.title}`}>
                <DotsThreeIcon size={20} weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(e)}>Redaguoti</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onSelect={() => setDeleting(e)}>
                Ištrinti
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
      <DeleteEventDialog event={deleting} onOpenChange={(o) => !o && setDeleting(null)} />
    </div>
  );
}
