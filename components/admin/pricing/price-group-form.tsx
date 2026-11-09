"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAdmin } from "../admin-store";
import { UnitAmountInput } from "../unit-amount-input";
import type { PriceGroup, PriceItem } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const amount = z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Neigiamų ar tuščių kainų negali būti.");
const schema = z.object({
  items: z.array(z.object({ id: z.string(), value: amount, max: amount.optional() })).superRefine((items, ctx) => {
    items.forEach((it, i) => {
      if (it.max !== undefined && Number(it.max) < Number(it.value))
        ctx.addIssue({ code: "custom", path: [i, "max"], message: "Viršutinė riba mažesnė už apatinę." });
    });
  }),
});
type Values = z.infer<typeof schema>;

const toValues = (items: PriceItem[]): Values => ({
  items: items.map((i) => ({ id: i.id, value: String(i.value), max: i.max === undefined ? undefined : String(i.max) })),
});

/** One price group: edit values (and ranges), save or reset the group. */
export function PriceGroupForm({ group, items }: { group: PriceGroup; items: PriceItem[] }) {
  const { updatePrices } = useAdmin();
  const { register, handleSubmit, reset, formState } = useForm<Values>({ resolver: zodResolver(schema), values: toValues(items) });
  const errors = formState.errors.items;

  const save = handleSubmit((v) => {
    updatePrices(
      v.items.map((row) => {
        const base = items.find((i) => i.id === row.id)!;
        return { ...base, value: Number(row.value), max: row.max === undefined ? undefined : Number(row.max) };
      }),
    );
    toast.success(`${group}: kainos atnaujintos`);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{group}</CardTitle>
      </CardHeader>
      <form onSubmit={save}>
        <CardContent className="divide-y">
          {items.map((item, i) => (
            <div key={item.id} className="grid grid-cols-[1fr_auto] items-center gap-3 py-3 first:pt-0 sm:gap-4">
              <div className="min-w-0">
                <label htmlFor={`${item.id}-value`} className="text-sm font-medium">
                  {item.label}
                </label>
                {errors?.[i]?.value || errors?.[i]?.max ? (
                  <p className="text-xs text-destructive">{errors?.[i]?.value?.message ?? errors?.[i]?.max?.message}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <UnitAmountInput id={`${item.id}-value`} unit={item.unit} aria-invalid={!!errors?.[i]?.value} {...register(`items.${i}.value`)} />
                {item.max !== undefined ? (
                  <>
                    <span className="text-muted-foreground">–</span>
                    <Input
                      inputMode="decimal"
                      aria-label={`${item.label}, iki`}
                      className="w-20 text-right tabular-nums sm:w-24"
                      aria-invalid={!!errors?.[i]?.max}
                      {...register(`items.${i}.max`)}
                    />
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="mt-4 justify-end gap-2 border-t pt-4">
          <Button type="button" variant="ghost" disabled={!formState.isDirty} onClick={() => reset(toValues(items))}>
            Atkurti
          </Button>
          <Button type="submit" disabled={!formState.isDirty}>
            Išsaugoti
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
