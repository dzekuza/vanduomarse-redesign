"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAdmin } from "../admin-store";
import type { Coupon } from "@/lib/admin/types";
import { formatEuro } from "@/lib/coupons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const toAmount = (v: string) => Number(v.replace(",", "."));

/** Amount and note for spending part (or all) of an active coupon. Remounted when the balance changes. */
export function RedeemForm({ coupon }: { coupon: Coupon }) {
  const { redeemCoupon } = useAdmin();
  const schema = z.object({
    amount: z
      .string()
      .trim()
      .regex(/^\d+([.,]\d{1,2})?$/, "Įveskite sumą, pvz. 25 arba 12,50.")
      .refine((v) => toAmount(v) > 0, "Suma turi būti didesnė už nulį.")
      .refine((v) => toAmount(v) <= coupon.balance, `Daugiausia ${formatEuro(coupon.balance)}.`),
    note: z.string().trim().max(200),
  });
  type Values = z.infer<typeof schema>;

  const { register, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { amount: String(coupon.balance), note: "" },
  });
  const err = formState.errors;

  const submit = handleSubmit(async (v) => {
    const result = await redeemCoupon(coupon.id, toAmount(v.amount), v.note);
    if ("data" in result) toast.success(`Nuskaityta ${formatEuro(toAmount(v.amount))}`);
  });

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm font-normal">Nuskaityti panaudojimą</p>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="redeem-amount">Suma, €</Label>
          <Input id="redeem-amount" inputMode="decimal" aria-invalid={!!err.amount} className="min-h-11" {...register("amount")} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="redeem-note">Pastaba</Label>
          <Input id="redeem-note" placeholder="Pvz., pirtis PM-1042" className="min-h-11" {...register("note")} />
        </div>
      </div>
      {err.amount ? <p className="text-xs text-destructive">{err.amount.message}</p> : null}
      <Button type="submit" variant="outline" disabled={formState.isSubmitting} className="min-h-11 w-full">
        {formState.isSubmitting ? "Nuskaitoma..." : "Nuskaityti"}
      </Button>
    </form>
  );
}
