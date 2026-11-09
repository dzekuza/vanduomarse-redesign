"use client";

import { DotsThreeIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { UpsellDialog } from "./upsell-dialog";
import { UPSELL_UNIT_LABEL, type Upsell } from "@/lib/sauna-upsells";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

type Editing = { upsell?: Upsell } | null;

/** Extras offered in the sauna booking: price, unit, on/off, edit and delete. */
export function UpsellsCard() {
  const { upsells, saunas, saveUpsell, deleteUpsell } = useAdmin();
  const offeredBy = (id: string) => saunas.filter((s) => s.upsellIds.includes(id)).map((s) => s.name);
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Upsell | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Papildomos paslaugos</CardTitle>
        <CardDescription>Bendras priedų sąrašas: pirtininkas, vantos ir kt. Kuri pirtis ką siūlo, nustatoma pirties nustatymuose.</CardDescription>
        <CardAction>
          <Button onClick={() => setEditing({})}>
            <PlusIcon size={18} /> <span className="hidden sm:inline">Nauja paslauga</span>
            <span className="sr-only sm:hidden">Nauja paslauga</span>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="divide-y">
        {upsells.length === 0 ? <p className="py-3 text-sm text-muted-foreground">Papildomų paslaugų nėra.</p> : null}
        {upsells.map((u) => (
          <div key={u.id} className="flex items-center gap-3 py-3 first:pt-0">
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-medium ${u.active ? "" : "text-muted-foreground line-through"}`}>{u.name}</p>
              <p className="truncate text-xs text-muted-foreground">{u.description}</p>
              <p className="truncate text-xs text-muted-foreground">{offeredBy(u.id).join(", ") || "Nesiūloma jokioje pirtyje"}</p>
            </div>
            <p className="shrink-0 text-right text-sm tabular-nums">
              <span className="font-display font-bold">{u.price} €</span>
              <span className="block text-xs text-muted-foreground">{UPSELL_UNIT_LABEL[u.unit]}</span>
            </p>
            <Switch
              checked={u.active}
              aria-label={`Rodyti „${u.name}“ rezervacijoje`}
              onCheckedChange={(v) => {
                saveUpsell({ ...u, active: v });
                toast.success(v ? `${u.name}: rodoma` : `${u.name}: paslėpta`);
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Veiksmai: ${u.name}`}>
                  <DotsThreeIcon size={20} weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditing({ upsell: u })}>Redaguoti</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onSelect={() => setDeleting(u)}>
                  Ištrinti
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </CardContent>

      {editing ? <UpsellDialog key={editing.upsell?.id ?? "new"} upsell={editing.upsell} onOpenChange={(o) => !o && setEditing(null)} /> : null}

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ištrinti „{deleting?.name}“?</DialogTitle>
            <DialogDescription>Jei norite tik laikinai nerodyti, verčiau išjunkite.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Palikti
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleting) return;
                deleteUpsell(deleting.id);
                toast.success("Paslauga ištrinta");
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
