"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { FormField } from "../form-field";
import { pageEditorSchema, type PageEditorValues } from "./page-content-schema";
import { PhotosCard } from "./photos-card";
import { FactsCard, QuestionsCard } from "./text-lists-card";
import { SERVICE_GALLERY } from "@/components/landing/content";
import { SERVICE_PAGES, type ServicePageCopy, type ServiceSlug } from "@/components/services/service-content";
import { mergeServiceCopy, overrideFromEdit } from "@/lib/page-content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/** The edit form for one public page: texts, info boxes, FAQ and photos. Saves only what differs from the code defaults. */
export function PageEditor({ slug }: { slug: ServiceSlug }) {
  const { pageContent, savePageContent } = useAdmin();
  const base: ServicePageCopy = SERVICE_PAGES[slug];
  const defaultPhotos = SERVICE_GALLERY[base.service];
  const saved = pageContent[slug];
  const [saving, setSaving] = useState(false);

  const initial = useMemo<PageEditorValues>(() => {
    const copy = mergeServiceCopy(base, saved);
    return {
      title: copy.title,
      summary: copy.summary,
      description: copy.description,
      metaDescription: copy.metaDescription ?? "",
      bookingIntro: copy.bookingIntro ?? "",
      availabilityNote: copy.availabilityNote ?? "",
      facts: copy.facts.map(({ label, value }) => ({ label, value })),
      questions: copy.questions.map(({ title, body }) => ({ title, body })),
      photos: (saved?.photos ?? defaultPhotos).map(({ src, alt }) => ({ src, alt })),
    };
  }, [base, saved, defaultPhotos]);

  const { register, control, handleSubmit, reset, formState } = useForm<PageEditorValues>({ resolver: zodResolver(pageEditorSchema), defaultValues: initial });
  const { errors } = formState;

  async function persist(values: PageEditorValues, message: string) {
    setSaving(true);
    const result = await savePageContent(slug, overrideFromEdit(base, defaultPhotos, values));
    setSaving(false);
    if ("error" in result) return false;
    toast.success(message);
    return true;
  }

  const save = handleSubmit(async (values) => {
    if (await persist(values, `${base.label}: puslapis atnaujintas`)) reset(values);
  });

  async function restoreDefaults() {
    setSaving(true);
    const result = await savePageContent(slug, {});
    setSaving(false);
    if ("error" in result) return;
    toast.success(`${base.label}: grąžinti numatytieji tekstai ir nuotraukos`);
    reset({
      title: base.title,
      summary: base.summary,
      description: base.description,
      metaDescription: base.metaDescription ?? "",
      bookingIntro: base.bookingIntro ?? "",
      availabilityNote: base.availabilityNote ?? "",
      facts: base.facts.map(({ label, value }) => ({ label, value })),
      questions: base.questions.map(({ title, body }) => ({ title, body })),
      photos: defaultPhotos.map(({ src, alt }) => ({ src, alt })),
    });
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tekstai</CardTitle>
          <CardDescription>Antraštė, santrauka ir aprašymas puslapio viršuje bei paieškos sistemoms.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField id="title" label="Pavadinimas (H1)" error={errors.title?.message}>
            <Input id="title" className="min-h-11" aria-invalid={!!errors.title} {...register("title")} />
          </FormField>
          <FormField id="summary" label="Santrauka" error={errors.summary?.message} hint="Trumpas tekstas po pavadinimu.">
            <Textarea id="summary" aria-invalid={!!errors.summary} {...register("summary")} />
          </FormField>
          <FormField id="description" label="Aprašymas" error={errors.description?.message} hint="Skiltis „Aprašymas“.">
            <Textarea id="description" className="min-h-32" aria-invalid={!!errors.description} {...register("description")} />
          </FormField>
          <FormField id="metaDescription" label="Aprašymas paieškai (neprivaloma)" error={errors.metaDescription?.message} hint="Iki 200 simbolių. Tuščią paliekus sudaromas iš santraukos ir aprašymo.">
            <Textarea id="metaDescription" className="min-h-16" aria-invalid={!!errors.metaDescription} {...register("metaDescription")} />
          </FormField>
          <FormField id="bookingIntro" label="Tekstas virš rezervacijos (neprivaloma)" error={errors.bookingIntro?.message}>
            <Textarea id="bookingIntro" className="min-h-16" {...register("bookingIntro")} />
          </FormField>
          <FormField id="availabilityNote" label="Pastaba prie tvarkaraščio (neprivaloma)" error={errors.availabilityNote?.message}>
            <Textarea id="availabilityNote" className="min-h-16" {...register("availabilityNote")} />
          </FormField>
        </CardContent>
      </Card>

      <FactsCard control={control} register={register} errors={errors} />
      <QuestionsCard control={control} register={register} errors={errors} />
      <PhotosCard slug={slug} control={control} register={register} />

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2 border-t bg-background py-3">
        <Button type="button" variant="ghost" className="min-h-11" disabled={saving} onClick={restoreDefaults}>
          Grąžinti numatytuosius
        </Button>
        <Button type="button" variant="ghost" className="min-h-11" disabled={!formState.isDirty || saving} onClick={() => reset(initial)}>
          Atkurti
        </Button>
        <Button type="submit" className="min-h-11" disabled={!formState.isDirty || saving}>
          {saving ? "Saugoma…" : "Išsaugoti"}
        </Button>
      </div>
    </form>
  );
}
