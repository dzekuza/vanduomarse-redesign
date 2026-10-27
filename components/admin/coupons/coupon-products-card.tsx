"use client";

import { DotsThreeIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { ProductDialog } from "./product-dialog";
import { COUPON_SERVICE_LABEL, formatEuro, type CouponProduct } from "@/lib/coupons";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

type Editing = { product?: CouponProduct } | null;

/** The catalogue on /kuponai: price, what it is good for, on/off, edit and delete. */
export function CouponProductsCard() {
  const { couponProducts, saveCouponProduct, deleteCouponProduct } = useAdmin();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<CouponProduct | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parduodami kuponai</CardTitle>
        <CardDescription>
          Kainos čia yra užšaldomos pirkimo metu: pakeitus kainą jau parduoti kuponai nesikeičia. Patirčių kainas derinkite su pirties ir
          nakvynės tarifais patys.
        </CardDescription>
        <CardAction>
          <Button onClick={() => setEditing({})}>
            <PlusIcon size={18} /> <span className="hidden sm:inline">Naujas kuponas</span>
            <span className="sr-only sm:hidden">Naujas kuponas</span>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="divide-y">
        {couponProducts.length === 0 ? <p className="py-3 text-sm text-muted-foreground">Kuponų nėra.</p> : null}
        {couponProducts.map((p) => (
          <div key={p.id} className="flex items-center gap-3 py-3 first:pt-0">
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-medium ${p.active ? "" : "text-muted-foreground line-through"}`}>{p.name}</p>
              <p className="truncate text-xs text-muted-foreground">{COUPON_SERVICE_LABEL[p.service]}</p>
            </div>
            <p className="shrink-0 font-display text-sm font-bold tabular-nums">{formatEuro(p.value)}</p>
            <Switch
              checked={p.active}
              aria-label={`Parduoti „${p.name}“`}
              onCheckedChange={(v) => {
                saveCouponProduct({ ...p, active: v });
                toast.success(v ? `${p.name}: parduodamas` : `${p.name}: paslėptas`);
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Veiksmai: ${p.name}`}>
                  <DotsThreeIcon size={20} weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditing({ product: p })}>Redaguoti</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onSelect={() => setDeleting(p)}>
                  Ištrinti
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </CardContent>

      {editing ? <ProductDialog key={editing.product?.id ?? "new"} product={editing.product} onOpenChange={(o) => !o && setEditing(null)} /> : null}

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ištrinti „{deleting?.name}“?</DialogTitle>
            <DialogDescription>Jei kuponas jau buvo užsakytas, jo ištrinti nepavyks; tokį verčiau išjunkite.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Palikti
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleting) return;
                deleteCouponProduct(deleting.id);
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
