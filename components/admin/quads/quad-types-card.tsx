"use client";

import { DotsThreeIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { QuadTypeDialog } from "./quad-type-dialog";
import type { QuadType } from "@/lib/quads";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

type Editing = { quadType?: QuadType } | null;

/** The fleet: how many of each quad, its price, and whether it can be rented online. */
export function QuadTypesCard() {
  const { quadTypes, saveQuadType, deleteQuadType } = useAdmin();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<QuadType | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parkas</CardTitle>
        <CardDescription>
          Pradiniai kiekiai ir kainos yra pavyzdiniai: patikrinkite juos prieš reklamuodami puslapį. Išjungtas tipas dingsta iš svetainės (pvz., dėl oro).
        </CardDescription>
        <CardAction>
          <Button onClick={() => setEditing({})}>
            <PlusIcon size={18} /> <span className="hidden sm:inline">Naujas tipas</span>
            <span className="sr-only sm:hidden">Naujas tipas</span>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="divide-y">
        {quadTypes.length === 0 ? <p className="py-3 text-sm text-muted-foreground">Keturračių nėra.</p> : null}
        {quadTypes.map((t) => (
          <div key={t.id} className="flex items-center gap-3 py-3 first:pt-0">
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-normal ${t.active ? "" : "text-muted-foreground line-through"}`}>{t.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {t.units} vnt. · {t.seats === 1 ? "1 vieta" : `${t.seats} vietos`}
              </p>
            </div>
            <p className="shrink-0 font-display text-sm font-bold tabular-nums">{t.pricePerHour} €/val.</p>
            <Switch
              checked={t.active}
              aria-label={`Nuomoti „${t.name}“`}
              onCheckedChange={(v) => {
                saveQuadType({ ...t, active: v });
                toast.success(v ? `${t.name}: nuomojamas` : `${t.name}: paslėptas`);
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Veiksmai: ${t.name}`}>
                  <DotsThreeIcon size={20} weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditing({ quadType: t })}>Redaguoti</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onSelect={() => setDeleting(t)}>
                  Ištrinti
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </CardContent>

      {editing ? <QuadTypeDialog key={editing.quadType?.id ?? "new"} quadType={editing.quadType} onOpenChange={(o) => !o && setEditing(null)} /> : null}

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ištrinti „{deleting?.name}“?</DialogTitle>
            <DialogDescription>Jei šio tipo jau buvo nuomų, ištrinti nepavyks; tokį verčiau išjunkite.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Palikti
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleting) return;
                deleteQuadType(deleting.id);
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
