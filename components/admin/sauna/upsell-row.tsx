import { DotsThreeIcon } from "@phosphor-icons/react";
import { UPSELL_UNIT_LABEL, type Upsell } from "@/lib/sauna-upsells";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface UpsellRowProps {
  upsell: Upsell;
  /** Names of the saunas that offer it. */
  offeredBy: readonly string[];
  onEdit: () => void;
  onDelete: () => void;
}

/** One extra (priedas) as a list row: name, description and where it is offered, price with its unit and the actions menu. Visibility is set in the edit dialog. */
export function UpsellRow({ upsell: u, offeredBy, onEdit, onDelete }: UpsellRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${u.active ? "" : "text-muted-foreground line-through"}`}>{u.name}</p>
        {u.description ? <p className="truncate text-xs text-muted-foreground">{u.description}</p> : null}
        <p className="truncate text-xs text-muted-foreground">{offeredBy.join(", ") || "Nesiūloma jokioje pirtyje"}</p>
      </div>
      <p className="shrink-0 text-right text-sm tabular-nums">
        <span className="font-display font-bold">{u.price} €</span>
        <span className="block text-xs text-muted-foreground">{UPSELL_UNIT_LABEL[u.unit]}</span>
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-11 shrink-0" aria-label={`Veiksmai: ${u.name}`}>
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
