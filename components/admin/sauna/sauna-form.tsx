"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { PricePreview } from "./price-preview";
import { ratesSchema } from "./rates-schema";
import { SaunaDetailsFields } from "./sauna-details-fields";
import { SaunaRatesFields } from "./sauna-rates-fields";
import { saunaSchema, type SaunaValues } from "./sauna-schema";
import { SaunaUpsellsField } from "./sauna-upsells-field";
import { DEFAULT_SAUNA_RATES, type Sauna } from "@/lib/sauna";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const toValues = (s?: Sauna): SaunaValues => ({
  name: s?.name ?? "",
  description: s?.description ?? "",
  features: (s?.features ?? []).map((value) => ({ value })),
  rates: s?.rates ?? DEFAULT_SAUNA_RATES,
  upsellIds: s?.upsellIds ?? [],
  // A new sauna starts hidden, so photos can be added before visitors see it.
  active: s?.active ?? false,
});

/** Create or edit a sauna: details, features, rates with a live price table, and offered extras. */
export function SaunaForm({ sauna }: { sauna?: Sauna }) {
  const { saveSauna } = useAdmin();
  const router = useRouter();
  const { register, control, handleSubmit, reset, formState } = useForm<SaunaValues>({
    resolver: zodResolver(saunaSchema),
    defaultValues: toValues(sauna),
  });
  const liveRates = useWatch({ control, name: "rates" });
  const preview = ratesSchema.safeParse(liveRates);

  const save = handleSubmit(async (values) => {
    const result = await saveSauna(sauna?.id ?? null, values);
    if ("error" in result) return;
    reset(values);
    if (sauna) {
      toast.success("Pirtis išsaugota");
    } else {
      toast.success("Pirtis sukurta. Dabar galite įkelti nuotraukas.");
      router.replace(`/admin/pirtis/${result.data.id}`);
    }
  });

  return (
    <form onSubmit={save} noValidate className="space-y-4">
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aprašymas</CardTitle>
              <CardDescription>Ką lankytojas mato rinkdamasis pirtį.</CardDescription>
            </CardHeader>
            <CardContent>
              <SaunaDetailsFields control={control} register={register} errors={formState.errors} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Papildomos paslaugos</CardTitle>
              <CardDescription>Kurias paslaugas galima užsisakyti su šia pirtimi.</CardDescription>
            </CardHeader>
            <CardContent>
              <SaunaUpsellsField control={control} />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kainos ir taisyklės</CardTitle>
              <CardDescription>Valandos kaina priklauso nuo grupės dydžio. Paketas taikomas, jei jis pigesnis.</CardDescription>
            </CardHeader>
            <CardContent>
              <SaunaRatesFields register={register} errors={formState.errors} />
            </CardContent>
          </Card>
          <PricePreview rates={preview.success ? preview.data : null} />
        </div>
      </div>
      <div className="sticky bottom-20 z-10 flex justify-end gap-2 border bg-card p-3 md:bottom-4">
        <Button type="button" variant="ghost" disabled={!formState.isDirty || formState.isSubmitting} onClick={() => reset()}>
          Atkurti
        </Button>
        <Button type="submit" disabled={(sauna && !formState.isDirty) || formState.isSubmitting}>
          {formState.isSubmitting ? "Saugoma…" : sauna ? "Išsaugoti" : "Sukurti pirtį"}
        </Button>
      </div>
    </form>
  );
}
