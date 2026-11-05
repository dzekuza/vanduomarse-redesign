"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DISCOUNT_KIND_LABEL, DISCOUNT_SERVICE_LABEL, DISCOUNT_SERVICES, type DiscountCode } from "@/lib/discount-codes";
import { discountCodeFormSchema, toDiscountCodeInput, type DiscountCodeFormValues } from "./discount-code-form";
import { ServiceChecks } from "./service-checks";

interface DiscountCodeDialogProps {
  code?: DiscountCode;
  onOpenChange: (open: boolean) => void;
}

/** Create or edit a discount code; remounted per code (key) so defaults reset. */
export function DiscountCodeDialog({ code, onOpenChange }: DiscountCodeDialogProps) {
  const { saveDiscountCode } = useAdmin();
  const { register, control, handleSubmit, setError, formState } = useForm<DiscountCodeFormValues>({
    resolver: zodResolver(discountCodeFormSchema),
    defaultValues: {
      code: code?.code ?? "",
      kind: code?.kind ?? "procentai",
      value: code ? String(code.value) : "",
      services: code?.services ?? [...DISCOUNT_SERVICES],
      validFrom: code?.validFrom ?? "",
      validUntil: code?.validUntil ?? "",
      maxUses: code?.maxUses ? String(code.maxUses) : "",
      active: code?.active ?? true,
      note: code?.note ?? "",
    },
  });
  const kind = useWatch({ control, name: "kind" });
  const err = formState.errors;

  const submit = handleSubmit(async (v) => {
    const result = await saveDiscountCode(toDiscountCodeInput(v, code?.id));
    if ("error" in result) {
      if (result.error.code === "duplicate") setError("code", { message: result.error.message });
      return;
    }
    toast.success(code ? "Kodas atnaujintas" : "Kodas sukurtas");
    onOpenChange(false);
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-9/10 overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{code ? "Redaguoti nuolaidos kodą" : "Naujas nuolaidos kodas"}</DialogTitle>
          <DialogDescription>Klientas jį įveda rezervacijos pabaigoje. Kainos su 21 % PVM.</DialogDescription>
        </DialogHeader>
        <form id="discount-code-form" onSubmit={submit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="dc-code">Kodas</Label>
            <Input id="dc-code" autoComplete="off" autoCapitalize="characters" spellCheck={false} className="uppercase" aria-invalid={!!err.code} {...register("code")} />
            {err.code ? <p className="text-xs text-destructive">{err.code.message}</p> : <p className="text-xs text-muted-foreground">Raidės ir skaitmenys; tarpai ir brūkšneliai nesvarbūs.</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dc-kind">Tipas</Label>
              <Controller
                control={control}
                name="kind"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="dc-kind" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="procentai">{DISCOUNT_KIND_LABEL.procentai}</SelectItem>
                      <SelectItem value="suma">{DISCOUNT_KIND_LABEL.suma}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dc-value">{kind === "procentai" ? "Nuolaida, %" : "Nuolaida, €"}</Label>
              <Input id="dc-value" inputMode="decimal" aria-invalid={!!err.value} {...register("value")} />
              {err.value ? <p className="text-xs text-destructive">{err.value.message}</p> : null}
            </div>
          </div>
          <Controller
            control={control}
            name="services"
            render={({ field }) => <ServiceChecks value={field.value} onChange={field.onChange} labels={DISCOUNT_SERVICE_LABEL} error={err.services?.message} />}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="dc-from">Galioja nuo</Label>
              <Controller control={control} name="validFrom" render={({ field }) => <DatePicker id="dc-from" value={field.value} onChange={field.onChange} placeholder="Iškart" />} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dc-until">Galioja iki</Label>
              <Controller
                control={control}
                name="validUntil"
                render={({ field }) => <DatePicker id="dc-until" value={field.value} onChange={field.onChange} placeholder="Neribotai" invalid={!!err.validUntil} />}
              />
              {err.validUntil ? <p className="text-xs text-destructive">{err.validUntil.message}</p> : null}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dc-max">Panaudojimų riba</Label>
            <Input id="dc-max" inputMode="numeric" placeholder="Neribota" aria-invalid={!!err.maxUses} {...register("maxUses")} />
            {err.maxUses ? (
              <p className="text-xs text-destructive">{err.maxUses.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Viena užklausa = vienas panaudojimas. Atšauktos užklausos panaudojimą grąžina.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dc-note">Pastaba darbuotojams</Label>
            <Input id="dc-note" placeholder="Pvz. Facebook akcija" aria-invalid={!!err.note} {...register("note")} />
            {err.note ? <p className="text-xs text-destructive">{err.note.message}</p> : null}
          </div>
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                Įjungtas
              </label>
            )}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Atšaukti
          </Button>
          <Button type="submit" form="discount-code-form" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? "Saugoma..." : code ? "Išsaugoti" : "Sukurti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
