"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { useFieldArray, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { FormField } from "../form-field";
import { RowControls } from "./row-controls";
import type { PageEditorValues } from "./page-content-schema";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ListProps {
  control: Control<PageEditorValues>;
  register: UseFormRegister<PageEditorValues>;
  errors: FieldErrors<PageEditorValues>;
}

/** The "Informacija" boxes: a short heading and a line of text each. Added to any boxes the page builds from live data (prices, saunas). */
export function FactsCard({ control, register, errors }: ListProps) {
  const { fields, append, remove, move } = useFieldArray({ control, name: "facts" });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informacijos langeliai</CardTitle>
        <CardDescription>Rodomi skiltyje „Informacija“. Pirties, keturračių ir namelių langelius puslapis sudaro pats iš jų nustatymų.</CardDescription>
        <CardAction>
          <Button type="button" variant="outline" className="min-h-11" disabled={fields.length >= 12} onClick={() => append({ label: "", value: "" })}>
            <PlusIcon size={18} /> Pridėti
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="divide-y">
        {fields.length === 0 ? <p className="text-sm text-muted-foreground">Langelių nėra.</p> : null}
        {fields.map((field, i) => (
          <div key={field.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1 space-y-3">
              <FormField id={`fact-label-${i}`} label="Pavadinimas" error={errors.facts?.[i]?.label?.message}>
                <Input id={`fact-label-${i}`} className="min-h-11" {...register(`facts.${i}.label`)} />
              </FormField>
              <FormField id={`fact-value-${i}`} label="Tekstas" error={errors.facts?.[i]?.value?.message}>
                <Textarea id={`fact-value-${i}`} {...register(`facts.${i}.value`)} />
              </FormField>
            </div>
            <RowControls index={i} count={fields.length} label={`Langelis ${i + 1}`} onMove={move} onRemove={() => remove(i)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/** The DUK accordion: a question and its answer each. */
export function QuestionsCard({ control, register, errors }: ListProps) {
  const { fields, append, remove, move } = useFieldArray({ control, name: "questions" });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dažniausiai užduodami klausimai</CardTitle>
        <CardDescription>Rodomi skiltyje „DUK“ ir paieškos sistemoms (Google gali rodyti atsakymus tiesiai paieškoje).</CardDescription>
        <CardAction>
          <Button type="button" variant="outline" className="min-h-11" disabled={fields.length >= 20} onClick={() => append({ title: "", body: "" })}>
            <PlusIcon size={18} /> Pridėti
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="divide-y">
        {fields.length === 0 ? <p className="text-sm text-muted-foreground">Klausimų nėra.</p> : null}
        {fields.map((field, i) => (
          <div key={field.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1 space-y-3">
              <FormField id={`question-title-${i}`} label="Klausimas" error={errors.questions?.[i]?.title?.message}>
                <Input id={`question-title-${i}`} className="min-h-11" {...register(`questions.${i}.title`)} />
              </FormField>
              <FormField id={`question-body-${i}`} label="Atsakymas" error={errors.questions?.[i]?.body?.message}>
                <Textarea id={`question-body-${i}`} {...register(`questions.${i}.body`)} />
              </FormField>
            </div>
            <RowControls index={i} count={fields.length} label={`Klausimas ${i + 1}`} onMove={move} onRemove={() => remove(i)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
