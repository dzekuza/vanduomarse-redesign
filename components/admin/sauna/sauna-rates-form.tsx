"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { PricePreview } from "./price-preview";
import { ratesSchema, type RatesValues } from "./rates-schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Field = { name: keyof RatesValues; label: string; unit: string };

const PRICE_FIELDS: Field[] = [
  { name: "smallGroupRate", label: "Maža grupė", unit: "€/val." },
  { name: "largeGroupRate", label: "Didelė grupė", unit: "€/val." },
  { name: "smallGroupMax", label: "Maža grupė iki", unit: "asm." },
  { name: "packageHours", label: "Paketo trukmė", unit: "val." },
  { name: "packagePrice", label: "Paketo kaina", unit: "€" },
];

const RULE_FIELDS: Field[] = [
  { name: "maxParty", label: "Daugiausia žmonių", unit: "asm." },
  { name: "minHours", label: "Minimali trukmė", unit: "val." },
  { name: "maxHours", label: "Maksimali trukmė", unit: "val." },
  { name: "openHour", label: "Atidaroma", unit: "val." },
  { name: "closeHour", label: "Uždaroma", unit: "val." },
];

/** Rates and booking rules with a live price table for the values being typed. */
export function SaunaRatesForm() {
  const { saunaRates, updateSaunaRates } = useAdmin();
  const { register, handleSubmit, reset, control, formState } = useForm<RatesValues>({
    resolver: zodResolver(ratesSchema),
    values: saunaRates,
  });
  const live = useWatch({ control });
  const parsed = ratesSchema.safeParse(live);

  const save = handleSubmit((v) => {
    updateSaunaRates(v);
    toast.success("Pirties kainos ir taisyklės atnaujintos");
  });

  const renderFields = (fields: Field[]) => (
    <div className="divide-y">
      {fields.map((f) => {
        const err = formState.errors[f.name]?.message;
        return (
          <div key={f.name} className="grid grid-cols-[1fr_auto] items-center gap-3 py-3 first:pt-0">
            <div className="min-w-0">
              <label htmlFor={`rate-${f.name}`} className="text-sm font-medium">
                {f.label}
              </label>
              <p className="text-xs text-muted-foreground">{f.unit}</p>
              {err ? <p className="text-xs text-destructive">{err}</p> : null}
            </div>
            <Input
              id={`rate-${f.name}`}
              type="number"
              inputMode="decimal"
              className="w-24 text-right tabular-nums"
              aria-invalid={!!err}
              {...register(f.name, { valueAsNumber: true })}
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <form onSubmit={save} className="grid items-start gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Kainos ir taisyklės</CardTitle>
          <CardDescription>Valandos kaina priklauso nuo grupės dydžio. Paketas taikomas, jei jis pigesnis.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Kainos</h3>
            {renderFields(PRICE_FIELDS)}
          </section>
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Rezervacijos taisyklės</h3>
            {renderFields(RULE_FIELDS)}
          </section>
        </CardContent>
        <CardFooter className="justify-end gap-2 border-t pt-4">
          <Button type="button" variant="ghost" disabled={!formState.isDirty} onClick={() => reset(saunaRates)}>
            Atkurti
          </Button>
          <Button type="submit" disabled={!formState.isDirty}>
            Išsaugoti
          </Button>
        </CardFooter>
      </Card>
      <PricePreview rates={parsed.success ? parsed.data : null} />
    </form>
  );
}
