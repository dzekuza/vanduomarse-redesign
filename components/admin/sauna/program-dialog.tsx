"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { programSchema, type ProgramFormValues } from "./program-schema";
import { PROGRAM_PRICING_LABEL, type ProgramPricing, type SaunaProgram } from "@/lib/sauna-programs";
import { slugify } from "@/lib/sauna";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const num = (s: string) => Number(s.replace(",", "."));

function toValues(p?: SaunaProgram): ProgramFormValues {
  return {
    name: p?.name ?? "",
    label: p?.label ?? "",
    description: p?.description ?? "",
    kind: p?.kind ?? "session",
    pricing: p?.pricing ?? "person",
    price: p ? String(p.price) : "",
    childPrice: p?.childPrice == null ? "" : String(p.childPrice),
    hours: p ? String(p.durationMinutes / 60) : "2",
    capacity: p?.capacity == null ? "" : String(p.capacity),
    saunaId: p?.saunaId ?? "",
    active: p?.active ?? true,
  };
}

interface Choice<T extends string> {
  id: string;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}

function Pick<T extends string>({ id, label, value, options, onChange }: Choice<T>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Create or edit a sauna program; remounted per item (key) so defaults reset. */
export function ProgramDialog({ program, onOpenChange }: { program?: SaunaProgram; onOpenChange: (open: boolean) => void }) {
  const { programs, saunas, saveProgram } = useAdmin();
  const { register, control, handleSubmit, setValue, formState } = useForm<ProgramFormValues>({ resolver: zodResolver(programSchema), defaultValues: toValues(program) });
  const kind = useWatch({ control, name: "kind" });
  const pricing = useWatch({ control, name: "pricing" });
  const saunaId = useWatch({ control, name: "saunaId" });
  const err = formState.errors;
  const text = (id: keyof ProgramFormValues, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`pg-${id}`}>{label}</Label>
      <Input id={`pg-${id}`} aria-invalid={!!err[id]} {...props} {...register(id as "name")} />
      {err[id] ? <p className="text-xs text-destructive">{err[id]?.message}</p> : null}
    </div>
  );

  const submit = handleSubmit((v) => {
    const taken = new Set(programs.map((p) => p.id));
    let id = program?.id ?? (slugify(v.name) || "programa");
    for (let n = 2; !program && taken.has(id); n++) id = `${slugify(v.name) || "programa"}-${n}`;
    saveProgram({
      id,
      name: v.name,
      label: v.label,
      description: v.description,
      kind: v.kind,
      pricing: v.pricing,
      price: num(v.price),
      childPrice: v.pricing === "family" ? num(v.childPrice) : null,
      durationMinutes: Math.round(num(v.hours) * 60),
      capacity: v.kind === "private" ? Number(v.capacity) : null,
      saunaId: v.kind === "private" ? v.saunaId : null,
      active: v.active,
      sortOrder: program?.sortOrder ?? Math.max(0, ...programs.map((p) => p.sortOrder)) + 1,
    });
    toast.success(program ? "Programa atnaujinta" : "Programa pridėta");
    onOpenChange(false);
  });

  const pricings: ProgramPricing[] = kind === "private" ? ["group"] : ["person", "family"];
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{program ? "Redaguoti programą" : "Nauja pirties programa"}</DialogTitle>
          <DialogDescription>Rodoma rezervacijos puslapyje, skirtuke „Pirtis“. Seansus (datą, laiką, vietų skaičių) kuriate skirtuke „Seansai“.</DialogDescription>
        </DialogHeader>
        <form id="program-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{text("name", "Pavadinimas")}</div>
          <div className="sm:col-span-2">{text("label", "Etiketė kortelėje", { placeholder: "Su pirtininku" })}</div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="pg-description">Aprašymas</Label>
            <Textarea id="pg-description" rows={2} aria-invalid={!!err.description} {...register("description")} />
            {err.description ? <p className="text-xs text-destructive">{err.description.message}</p> : null}
          </div>
          <Pick id="pg-pricing" label="Kaina skaičiuojama" value={pricing} onChange={(v) => setValue("pricing", v)} options={pricings.map((p) => ({ value: p, label: PROGRAM_PRICING_LABEL[p] }))} />
          {text("price", pricing === "family" ? "Suaugusiojo kaina, €" : pricing === "group" ? "Kaina grupei, €" : "Kaina asmeniui, €", { inputMode: "decimal" })}
          {pricing === "family" ? text("childPrice", "Vaiko kaina, €", { inputMode: "decimal" }) : null}
          {text("hours", "Trukmė, val.", { inputMode: "decimal" })}
          {kind === "private" ? (
            <>
              {text("capacity", "Daugiausia žmonių", { inputMode: "numeric" })}
              <div className="space-y-1.5">
                <Label htmlFor="pg-sauna">Kuri pirtis užimama</Label>
                <Select value={saunaId} onValueChange={(v) => setValue("saunaId", v)}>
                  <SelectTrigger id="pg-sauna" className="w-full">
                    <SelectValue placeholder="Pasirinkite" />
                  </SelectTrigger>
                  <SelectContent>
                    {saunas.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {err.saunaId ? <p className="text-xs text-destructive">{err.saunaId.message}</p> : null}
              </div>
            </>
          ) : null}
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <label className="flex min-h-11 items-center gap-3 text-sm sm:col-span-2">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                Rodyti rezervacijoje
              </label>
            )}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Atšaukti
          </Button>
          <Button type="submit" form="program-form">
            {program ? "Išsaugoti" : "Pridėti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
