"use client";

import { DotsThreeIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { TourAccessoryDialog } from "./tour-accessory-dialog";
import type { QuadTourAccessory } from "@/lib/quads";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

type Editing = { accessory?: QuadTourAccessory } | null;

/** Optional gear sold with a tour (helmet, suits): price per item. */
export function TourAccessoriesCard() {
  const { quadTourAccessories, saveQuadTourAccessory, deleteQuadTourAccessory } = useAdmin();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<QuadTourAccessory | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Turų priedai</CardTitle>
        <CardDescription>Pasirenkami turo rezervacijoje. Seni užsakymai išsaugo tuometinį pavadinimą ir kainą.</CardDescription>
        <CardAction>
          <Button onClick={() => setEditing({})}>
            <PlusIcon size={18} /> <span className="hidden sm:inline">Naujas priedas</span>
            <span className="sr-only sm:hidden">Naujas priedas</span>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="divide-y">
        {quadTourAccessories.length === 0 ? <p className="py-3 text-sm text-muted-foreground">Priedų nėra.</p> : null}
        {quadTourAccessories.map((a) => (
          <div key={a.id} className="flex items-center gap-3 py-3 first:pt-0">
            <p className={`min-w-0 flex-1 truncate text-sm font-medium ${a.active ? "" : "text-muted-foreground line-through"}`}>{a.name}</p>
            <p className="shrink-0 font-display text-sm font-bold tabular-nums">{a.price} €</p>
            <Switch
              checked={a.active}
              aria-label={`Siūlyti „${a.name}“`}
              onCheckedChange={(v) => {
                saveQuadTourAccessory({ ...a, active: v });
                toast.success(v ? `${a.name}: siūlomas` : `${a.name}: paslėptas`);
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Veiksmai: ${a.name}`}>
                  <DotsThreeIcon size={20} weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditing({ accessory: a })}>Redaguoti</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onSelect={() => setDeleting(a)}>
                  Ištrinti
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </CardContent>

      {editing ? <TourAccessoryDialog key={editing.accessory?.id ?? "new"} accessory={editing.accessory} onOpenChange={(o) => !o && setEditing(null)} /> : null}

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ištrinti „{deleting?.name}“?</DialogTitle>
            <DialogDescription>Esami užsakymai išsaugo savo prieduose užfiksuotą pavadinimą ir kainą.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Palikti
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleting) return;
                deleteQuadTourAccessory(deleting.id);
                setDeleting(null);
              }}
            >
              Ištrinti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
