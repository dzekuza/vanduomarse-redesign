"use client";

import { DotsThreeIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { formatPlanPrice } from "@/lib/ride-plans";
import type { RidePlan } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

interface PlanCardProps {
  plan: RidePlan;
  onSave: (plan: RidePlan) => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** One catalogue plan as a card: name, description, price, the shown / sold-online switches and the edit / delete menu. */
export function PlanCard({ plan: p, onSave, onEdit, onDelete }: PlanCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <p className={`min-w-0 text-sm font-bold ${p.active ? "" : "text-muted-foreground line-through"}`}>{p.name}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="-mt-1 -mr-2 shrink-0" aria-label={`Veiksmai: ${p.name}`}>
                <DotsThreeIcon size={20} weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEdit}>Redaguoti</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onSelect={onDelete}>
                Ištrinti
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {p.description ? <p className="line-clamp-2 text-xs text-muted-foreground">{p.description}</p> : null}
        <p className="mt-auto font-display text-figure font-bold tabular-nums">{formatPlanPrice(p.price)}</p>
        <div className="space-y-2 border-t pt-3 text-xs text-muted-foreground">
          <label className="flex min-h-8 items-center justify-between gap-2">
            Rodyti
            <Switch
              checked={p.active}
              aria-label={`Rodyti „${p.name}“`}
              onCheckedChange={(v) => {
                onSave({ ...p, active: v });
                toast.success(v ? `${p.name}: rodomas` : `${p.name}: paslėptas`);
              }}
            />
          </label>
          <label className="flex min-h-8 items-center justify-between gap-2">
            Internetu
            <Switch
              checked={p.soldOnline}
              disabled={!p.price}
              aria-label={`Parduoti internetu: ${p.name}`}
              onCheckedChange={(v) => {
                onSave({ ...p, soldOnline: v });
                toast.success(v ? `${p.name}: parduodamas internetu` : `${p.name}: nebeparduodamas internetu`);
              }}
            />
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
