"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAdmin } from "../admin-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const int = (min: number, max: number) =>
  z.string().trim().regex(/^\d+$/, "Sveikas skaičius.").refine((v) => Number(v) >= min && Number(v) <= max, `Nuo ${min} iki ${max}.`);

const schema = z
  .object({
    openHour: int(0, 23),
    closeHour: int(1, 24),
    maxHours: int(1, 8),
    minAge: int(10, 99),
    deposit: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Įveskite sumą, pvz. 50 arba 0."),
    rules: z.string().trim().max(800, "Daugiausia 800 simbolių."),
    tourCancellationNote: z.string().trim().max(200, "Daugiausia 200 simbolių."),
  })
  .refine((v) => Number(v.closeHour) > Number(v.openHour), { message: "Uždarymas turi būti vėliau nei atidarymas.", path: ["closeHour"] });
type Values = z.infer<typeof schema>;

/** Opening hours, longest rental, deposit, minimum age and the rules text shown on /keturraciai. */
export function QuadSettingsCard() {
  const { quadSettings: s, updateQuadSettings } = useAdmin();
  const { register, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      openHour: String(s.openHour),
      closeHour: String(s.closeHour),
      maxHours: String(s.maxHours),
      minAge: String(s.minAge),
      deposit: String(s.deposit),
      rules: s.rules,
      tourCancellationNote: s.tourCancellationNote,
    },
  });
  const err = formState.errors;

  const submit = handleSubmit((v) => {
    updateQuadSettings({
      openHour: Number(v.openHour),
      closeHour: Number(v.closeHour),
      maxHours: Number(v.maxHours),
      minAge: Number(v.minAge),
      deposit: Number(v.deposit),
      rules: v.rules,
      tourCancellationNote: v.tourCancellationNote,
    });
    toast.success("Nustatymai išsaugoti");
  });

  const field = (id: keyof Values, label: string, hint?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={`qs-${id}`}>{label}</Label>
      <Input id={`qs-${id}`} inputMode="decimal" aria-invalid={!!err[id]} className="min-h-11" {...register(id)} />
      {err[id] ? <p className="text-xs text-destructive">{err[id]?.message}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuomos taisyklės</CardTitle>
        <CardDescription>Rodoma /keturraciai puslapyje ir tikrinama kiekvienai užklausai.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {field("openHour", "Pirma pradžia, val.")}
            {field("closeHour", "Uždarymas, val.", "Nuoma baigiasi iki šios valandos")}
            {field("maxHours", "Ilgiausia nuoma, val.")}
            {field("minAge", "Amžius nuo")}
            {field("deposit", "Užstatas, €", "0 = nerodoma")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qs-rules">Taisyklės (rodomos puslapyje)</Label>
            <Textarea id="qs-rules" rows={5} aria-invalid={!!err.rules} {...register("rules")} />
            {err.rules ? <p className="text-xs text-destructive">{err.rules.message}</p> : <p className="text-xs text-muted-foreground">Tuščia = skiltis nerodoma.</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qs-tourCancellationNote">Turo atšaukimo sąlyga</Label>
            <Input id="qs-tourCancellationNote" aria-invalid={!!err.tourCancellationNote} className="min-h-11" {...register("tourCancellationNote")} />
            {err.tourCancellationNote ? <p className="text-xs text-destructive">{err.tourCancellationNote.message}</p> : <p className="text-xs text-muted-foreground">Rodoma prie turo rezervacijos. Tuščia = nerodoma.</p>}
          </div>
          <Button type="submit" disabled={!formState.isDirty} className="min-h-11">
            Išsaugoti
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
