"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { createInquiry } from "@/app/actions/requests";
import { ArrowButton } from "@/components/booking/arrow-button";
import { ContactFields } from "@/components/quads/contact-fields";
import { Textarea } from "@/components/ui/textarea";
import type { Estimate, EstimateInput } from "@/lib/event-pricing";
import { messageContactSchema, type MessageContactValues } from "@/lib/request-schema";

interface InquiryFormProps {
  estimate: Estimate;
  input: EstimateInput;
  guests: number;
  eventLabel: string;
  spaceLabel: string;
}

/** "Siųsti užklausą": stores the quote, with the event date chosen above, and the calculator input so staff can reopen it in /admin/uzklausos. */
export function InquiryForm({ estimate, input, guests, eventLabel, spaceLabel }: InquiryFormProps) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const form = useForm<MessageContactValues>({
    resolver: zodResolver(messageContactSchema),
    defaultValues: { customerName: "", customerPhone: "", customerEmail: "", website: "", message: "" },
  });

  const submit = form.handleSubmit(async ({ message, ...contact }) => {
    const result = await createInquiry({
      ...contact,
      message,
      date: input.date ?? "",
      eventType: eventLabel,
      guests,
      space: spaceLabel,
      estimateMin: estimate.total.min,
      estimateMax: estimate.total.max,
      calculatorInput: { ...input, lines: estimate.lines },
    });
    if ("error" in result) return form.setError("root", { message: result.error.message });
    setSent(true);
  });

  if (sent) {
    return (
      <p role="status" className="text-sm">
        Ačiū, užklausą gavome. Susisieksime telefonu arba el. paštu.
      </p>
    );
  }

  if (!open) return <ArrowButton onClick={() => setOpen(true)}>Siųsti užklausą</ArrowButton>;

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <ContactFields idPrefix="inquiry" />
        <Textarea placeholder="Komentaras (nebūtina)" aria-label="Komentaras" {...form.register("message")} />
        {form.formState.errors.root ? (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        ) : null}
        <ArrowButton type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Siunčiama..." : "Siųsti užklausą"}
        </ArrowButton>
      </form>
    </FormProvider>
  );
}
