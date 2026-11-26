"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAdmin } from "../admin-store";
import { FormField } from "../form-field";
import type { ManagedSpace } from "@/lib/space-booking";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const optionalPrice = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || /^\d+([.,]\d{1,2})?$/.test(v),
    "Suma arba tuščia, jei tuo metu nenuomojama.",
  );

const schema = z.object({
  label: z.string().trim().min(2, "Įveskite pavadinimą.").max(80),
  blurb: z.string().trim().max(300),
  maxGuests: z
    .string()
    .trim()
    .regex(/^\d+$/, "Sveikas skaičius.")
    .refine((v) => Number(v) >= 1 && Number(v) <= 5000, "Nuo 1 iki 5000."),
  priceWeekday: optionalPrice,
  priceWeekend: optionalPrice,
  wholePark: z.boolean(),
  active: z.boolean(),
});
type Values = z.infer<typeof schema>;

const toPrice = (v: string) => (v === "" ? null : Number(v.replace(",", ".")));
const fromPrice = (n: number | null | undefined) =>
  n == null ? "" : String(n);

interface SpaceDialogProps {
  /** Null = a new space. */
  space: ManagedSpace | null;
  nextOrder: number;
  onOpenChange: (open: boolean) => void;
}

/** Add or edit an event space: name, capacity, rent and whether it is offered. Remounted per space (key). */
export function SpaceDialog({
  space,
  nextOrder,
  onOpenChange,
}: SpaceDialogProps) {
  const { saveSpace } = useAdmin();
  const { register, control, handleSubmit, setError, formState } =
    useForm<Values>({
      resolver: zodResolver(schema),
      defaultValues: {
        label: space?.label ?? "",
        blurb: space?.blurb ?? "",
        maxGuests: String(space?.maxGuests ?? 50),
        priceWeekday: fromPrice(space?.priceWeekday),
        priceWeekend: fromPrice(space?.priceWeekend),
        wholePark: space?.wholePark ?? false,
        active: space?.active ?? true,
      },
    });
  const err = formState.errors;

  const submit = handleSubmit(async (v) => {
    const result = await saveSpace({
      id: space?.id ?? null,
      label: v.label,
      blurb: v.blurb,
      maxGuests: Number(v.maxGuests),
      priceWeekday: toPrice(v.priceWeekday),
      priceWeekend: toPrice(v.priceWeekend),
      wholePark: v.wholePark,
      active: v.active,
      sortOrder: space?.sortOrder ?? nextOrder,
    });
    if ("error" in result)
      return setError("root", { message: result.error.message });
    toast.success(space ? "Erdvė atnaujinta" : "Erdvė pridėta");
    onOpenChange(false);
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {space ? `Redaguoti: ${space.label}` : "Nauja erdvė"}
          </DialogTitle>
          <DialogDescription>
            Kaina su PVM, už nuomą. Rezervuojant ji tik pasiūloma: galutinę
            kainą įvedate patys.
          </DialogDescription>
        </DialogHeader>
        <form
          id="space-form"
          onSubmit={submit}
          className="grid gap-4 sm:grid-cols-2"
        >
          <FormField
            id="sp-label"
            label="Pavadinimas"
            error={err.label?.message}
            className="sm:col-span-2"
          >
            <Input
              id="sp-label"
              aria-invalid={!!err.label}
              className="min-h-11"
              {...register("label")}
            />
          </FormField>
          <FormField
            id="sp-blurb"
            label="Aprašymas (nebūtina)"
            error={err.blurb?.message}
            className="sm:col-span-2"
          >
            <Textarea id="sp-blurb" rows={2} {...register("blurb")} />
          </FormField>
          <FormField
            id="sp-guests"
            label="Daugiausia žmonių"
            error={err.maxGuests?.message}
          >
            <Input
              id="sp-guests"
              inputMode="numeric"
              aria-invalid={!!err.maxGuests}
              className="min-h-11"
              {...register("maxGuests")}
            />
          </FormField>
          <div className="hidden sm:block" />
          <FormField
            id="sp-weekday"
            label="Kaina I–IV dieną, €"
            error={err.priceWeekday?.message}
            hint="Kai nuoma prasideda iki 17:00."
          >
            <Input
              id="sp-weekday"
              inputMode="decimal"
              placeholder="Nenuomojama"
              aria-invalid={!!err.priceWeekday}
              className="min-h-11"
              {...register("priceWeekday")}
            />
          </FormField>
          <FormField
            id="sp-weekend"
            label="Kaina vakare ir V–VII, €"
            error={err.priceWeekend?.message}
            hint="Vakarais nuo 17:00 ir savaitgaliais."
          >
            <Input
              id="sp-weekend"
              inputMode="decimal"
              placeholder="Nenuomojama"
              aria-invalid={!!err.priceWeekend}
              className="min-h-11"
              {...register("priceWeekend")}
            />
          </FormField>
          <Controller
            control={control}
            name="wholePark"
            render={({ field }) => (
              <label className="flex min-h-11 items-center gap-3 text-sm sm:col-span-2">
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                Užima visą parką (tuo metu kitų erdvių nuomoti negalima)
              </label>
            )}
          />
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <label className="flex min-h-11 items-center gap-3 text-sm sm:col-span-2">
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                Nuomojama (rodoma naujoje rezervacijoje)
              </label>
            )}
          />
          {err.root?.message ? (
            <p role="alert" className="text-sm text-destructive sm:col-span-2">
              {err.root.message}
            </p>
          ) : null}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Atšaukti
          </Button>
          <Button
            type="submit"
            form="space-form"
            disabled={formState.isSubmitting}
          >
            {space ? "Išsaugoti" : "Pridėti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
