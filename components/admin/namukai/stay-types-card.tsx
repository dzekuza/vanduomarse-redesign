"use client";

import { DotsThreeIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { StayTypeDialog } from "./stay-type-dialog";
import { guestsLabel, stayTypesOf, type StayKind, type StayType } from "@/lib/cabin";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

interface StayTypesCardProps {
  kind: StayKind;
  title: string;
  description: string;
  onCreate: () => void;
}

/** The stay types of one kind: stock, guests, price, an online on / off switch and edit / delete. */
export function StayTypesCard({ kind, title, description, onCreate }: StayTypesCardProps) {
  const { stayTypes, saveStayType, deleteStayType } = useAdmin();
  const [editing, setEditing] = useState<StayType | null>(null);
  const [deleting, setDeleting] = useState<StayType | null>(null);
  const types = stayTypesOf(stayTypes, kind);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Button variant="outline" onClick={onCreate} className="min-h-11">
            <PlusIcon size={18} /> <span className="hidden sm:inline">Pridėti</span>
            <span className="sr-only sm:hidden">Pridėti</span>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="divide-y">
        {types.length === 0 ? <p className="py-3 text-sm text-muted-foreground">Dar nėra nė vieno tipo.</p> : null}
        {types.map((t) => (
          <div key={t.id} className="flex items-center gap-3 py-3 first:pt-0">
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-medium ${t.active ? "" : "text-muted-foreground line-through"}`}>{t.label}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[t.units === null ? "neribota" : `${t.units} vnt.`, guestsLabel(t.maxGuests), t.note].filter(Boolean).join(" · ")}
              </p>
            </div>
            <p className="shrink-0 font-display text-sm font-bold tabular-nums">{t.pricePerNight} €/n.</p>
            <Switch
              checked={t.active}
              aria-label={`Rodyti svetainėje: ${t.label}`}
              onCheckedChange={(active) => {
                saveStayType({ ...t, active });
                toast.success(active ? `${t.label}: rodomas` : `${t.label}: paslėptas`);
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Veiksmai: ${t.label}`}>
                  <DotsThreeIcon size={20} weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditing(t)}>Redaguoti</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onSelect={() => setDeleting(t)}>
                  Ištrinti
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </CardContent>

      {editing ? <StayTypeDialog key={editing.id} kind={editing.kind} stayType={editing} onOpenChange={(open) => !open && setEditing(null)} /> : null}

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ištrinti „{deleting?.label}“?</DialogTitle>
            <DialogDescription>Jei šio tipo jau buvo rezervacijų, ištrinti nepavyks; tokį verčiau paslėpkite.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Palikti
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleting) return;
                deleteStayType(deleting.id);
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
