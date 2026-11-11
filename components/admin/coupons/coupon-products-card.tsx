"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { AdminSection } from "../admin-section";
import { CouponProductTile } from "./coupon-product-tile";
import { ProductDialog } from "./product-dialog";
import type { CouponProduct } from "@/lib/coupons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Editing = { product?: CouponProduct } | null;

/** The catalogue on /kuponai: price, what it is good for, on/off, edit and delete. */
export function CouponProductsCard() {
  const { couponProducts, saveCouponProduct, deleteCouponProduct } = useAdmin();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<CouponProduct | null>(null);

  return (
    <AdminSection
      title="Parduodami kuponai"
      description="Kainos čia yra užšaldomos pirkimo metu: pakeitus kainą jau parduoti kuponai nesikeičia. Patirčių kainas derinkite su pirties ir nakvynės tarifais patys."
      action={
        <Button onClick={() => setEditing({})}>
          <PlusIcon size={18} /> <span className="hidden sm:inline">Naujas kuponas</span>
          <span className="sr-only sm:hidden">Naujas kuponas</span>
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {couponProducts.length === 0 ? <p className="text-sm text-muted-foreground sm:col-span-2 xl:col-span-4">Kuponų nėra.</p> : null}
        {couponProducts.map((p) => (
          <CouponProductTile
            key={p.id}
            product={p}
            onToggle={(v) => {
              saveCouponProduct({ ...p, active: v });
              toast.success(v ? `${p.name}: parduodamas` : `${p.name}: paslėptas`);
            }}
            onEdit={() => setEditing({ product: p })}
            onDelete={() => setDeleting(p)}
          />
        ))}
      </div>

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
    </AdminSection>
  );
}
