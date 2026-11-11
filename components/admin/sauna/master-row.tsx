"use client";

import { DotsThreeIcon } from "@phosphor-icons/react";
import type { SaunaMaster } from "@/lib/sauna-masters";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface MasterRowProps {
  master: SaunaMaster;
  onEdit: () => void;
  onDelete: () => void;
}

/** One pirtininkas: name, price per booking and shortest hourly session; edit and delete in the menu. */
export function MasterRow({ master: m, onEdit, onDelete }: MasterRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${m.active ? "" : "text-muted-foreground line-through"}`}>{m.name}</p>
        {m.description ? <p className="truncate text-xs text-muted-foreground">{m.description}</p> : null}
        <p className="truncate text-xs text-muted-foreground">Pagal valandas – nuo {m.minHours} val.</p>
      </div>
      <p className="shrink-0 text-right text-sm tabular-nums">
        <span className="font-display font-bold">{m.price} €</span>
        <span className="block text-xs text-muted-foreground">už rezervaciją</span>
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-11 shrink-0" aria-label={`Veiksmai: ${m.name}`}>
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
  );
}
