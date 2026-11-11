import { DotsThreeIcon } from "@phosphor-icons/react";
import { COUPON_SERVICE_LABEL, formatEuro, type CouponProduct } from "@/lib/coupons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

interface CouponProductTileProps {
  product: CouponProduct;
  onToggle: (active: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** One catalogue product as a card block: name and actions, price, what it is good for, and the sell on/off switch. */
export function CouponProductTile({ product: p, onToggle, onEdit, onDelete }: CouponProductTileProps) {
  return (
    <Card className={p.active ? undefined : "bg-muted/40"}>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle className={`text-item ${p.active ? "" : "text-muted-foreground line-through"}`}>{p.name}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="-mt-2 -mr-2 size-11" aria-label={`Veiksmai: ${p.name}`}>
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
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-display text-figure font-bold tabular-nums">{formatEuro(p.value)}</p>
          <p className="text-xs text-muted-foreground">{COUPON_SERVICE_LABEL[p.service]}</p>
        </div>
        <label className="flex min-h-11 items-center justify-between gap-3 border-t pt-3 text-sm">
          {p.active ? "Parduodamas" : "Paslėptas"}
          <Switch checked={p.active} aria-label={`Parduoti „${p.name}“`} onCheckedChange={onToggle} />
        </label>
      </CardContent>
    </Card>
  );
}
