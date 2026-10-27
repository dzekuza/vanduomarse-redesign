"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAdmin } from "../admin-store";
import { COUPON_SERVICE_LABEL, type CouponProduct, type CouponService } from "@/lib/coupons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

/** Services an experience coupon can be tied to ("visi" belongs to euro coupons). */
const SERVICES = (Object.keys(COUPON_SERVICE_LABEL) as CouponService[]).filter((s) => s !== "visi");

const schema = z.object({
  name: z.string().trim().min(2, "Įveskite pavadinimą.").max(80),
  description: z.string().trim().max(200),
  kind: z.enum(["verte", "paslauga"]),
  service: z.enum(["kabelis", "pirtis", "miegas"]),
  value: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Įveskite sumą, pvz. 50.").refine((v) => Number(v) > 0, "Suma turi būti didesnė už nulį."),
  active: z.boolean(),
});
type Values = z.infer<typeof schema>;

interface ProductDialogProps {
  product?: CouponProduct;
  onOpenChange: (open: boolean) => void;
}

/** Create or edit a coupon product; remounted per product (key) so defaults reset. */
export function ProductDialog({ product, onOpenChange }: ProductDialogProps) {
  const { saveCouponProduct } = useAdmin();
  const { register, control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
      kind: product?.kind ?? "verte",
      service: product && product.service !== "visi" ? product.service : "pirtis",
      value: product ? String(product.value) : "",
      active: product?.active ?? true,
    },
  });
  const kind = useWatch({ control, name: "kind" });
  const err = formState.errors;

  const submit = handleSubmit((v) => {
    saveCouponProduct({
      id: product?.id ?? `kuponas-${crypto.randomUUID().slice(0, 8)}`,
      kind: v.kind,
      service: v.kind === "verte" ? "visi" : v.service,
      name: v.name,
      description: v.description,
      value: Number(v.value),
      active: v.active,
    });
    toast.success(product ? "Kuponas atnaujintas" : "Kuponas pridėtas");
    onOpenChange(false);
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product ? "Redaguoti kuponą" : "Naujas kuponas"}</DialogTitle>
          <DialogDescription>Rodomas puslapyje /kuponai, kai įjungtas.</DialogDescription>
        </DialogHeader>
        <form id="coupon-product-form" onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cp-name">Pavadinimas</Label>
            <Input id="cp-name" aria-invalid={!!err.name} {...register("name")} />
            {err.name ? <p className="text-xs text-destructive">{err.name.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-desc">Aprašymas</Label>
            <Input id="cp-desc" {...register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cp-kind">Tipas</Label>
              <Controller
                control={control}
                name="kind"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="cp-kind" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="verte">Vertės kuponas</SelectItem>
                      <SelectItem value="paslauga">Patirtis</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-value">Vertė, €</Label>
              <Input id="cp-value" inputMode="decimal" aria-invalid={!!err.value} {...register("value")} />
              {err.value ? <p className="text-xs text-destructive">{err.value.message}</p> : null}
            </div>
          </div>
          {kind === "paslauga" ? (
            <div className="space-y-1.5">
              <Label htmlFor="cp-service">Skirta paslaugai</Label>
              <Controller
                control={control}
                name="service"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="cp-service" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {COUPON_SERVICE_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Vertės kuponą galima išleisti bet kuriai paslaugai.</p>
          )}
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                Parduoti svetainėje
              </label>
            )}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Atšaukti
          </Button>
          <Button type="submit" form="coupon-product-form">
            {product ? "Išsaugoti" : "Pridėti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
