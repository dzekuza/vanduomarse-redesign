"use client";

import { DotsThreeIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { TourRouteDialog } from "./tour-route-dialog";
import type { QuadTourRoute } from "@/lib/quads";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

type Editing = { route?: QuadTourRoute } | null;

/** Mini / Midi / Maxi: price per quad, hours, minimum quads. What the quad pages sell and bill. */
export function TourRoutesCard() {
  const { quadTourRoutes, saveQuadTourRoute, deleteQuadTourRoute } = useAdmin();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<QuadTourRoute | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Turų tipai</CardTitle>
        <CardDescription>
          Pavadinimas, trukmė ir kaina. Turus galima rezervuoti bet kuriuo laiku, kol yra laisvų keturračių; mažiausią keturračių skaičių nustatote čia. Kaina už keturratį su PVM; užsakymo sumą visada perskaičiuoja duomenų bazė iš šių reikšmių.
        </CardDescription>
        <CardAction>
          <Button onClick={() => setEditing({})}>
            <PlusIcon size={18} /> <span className="hidden sm:inline">Naujas tipas</span>
            <span className="sr-only sm:hidden">Naujas tipas</span>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="divide-y">
        {quadTourRoutes.length === 0 ? <p className="py-3 text-sm text-muted-foreground">Turų tipų nėra.</p> : null}
        {quadTourRoutes.map((r) => (
          <div key={r.id} className="flex items-center gap-3 py-3 first:pt-0">
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-medium ${r.active ? "" : "text-muted-foreground line-through"}`}>{r.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {r.kilometres} km · {r.hours} val. · bent {r.minUnits} keturračiai
              </p>
            </div>
            <p className="shrink-0 font-display text-sm font-bold tabular-nums">{r.price} €</p>
            <Switch
              checked={r.active}
              aria-label={`Rodyti „${r.name}“`}
              onCheckedChange={(v) => {
                saveQuadTourRoute({ ...r, active: v });
                toast.success(v ? `${r.name}: rodomas` : `${r.name}: paslėptas`);
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Veiksmai: ${r.name}`}>
                  <DotsThreeIcon size={20} weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditing({ route: r })}>Redaguoti</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onSelect={() => setDeleting(r)}>
                  Ištrinti
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </CardContent>

      {editing ? <TourRouteDialog key={editing.route?.id ?? "new"} route={editing.route} onOpenChange={(o) => !o && setEditing(null)} /> : null}

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ištrinti „{deleting?.name}“?</DialogTitle>
            <DialogDescription>Jei šio turo jau buvo rezervacijų, ištrinti nepavyks; tokį verčiau išjunkite.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Palikti
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleting) return;
                deleteQuadTourRoute(deleting.id);
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
