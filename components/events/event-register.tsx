"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { registerForEvent } from "@/app/actions/requests";
import { ArrowButton } from "@/components/booking/arrow-button";
import { Stepper } from "@/components/booking/stepper";
import { ContactFields } from "@/components/quads/contact-fields";
import { Textarea } from "@/components/ui/textarea";
import { messageContactSchema, type MessageContactValues } from "@/lib/request-schema";

/** Registration form for an event without a seat limit; staff see it in /admin/uzklausos. */
export function EventRegister({ eventId, title }: { eventId: string; title: string }) {
  const [people, setPeople] = useState(1);
  const [sent, setSent] = useState(false);
  const form = useForm<MessageContactValues>({
    resolver: zodResolver(messageContactSchema),
    defaultValues: { customerName: "", customerPhone: "", customerEmail: "", website: "", message: "" },
  });

  const submit = form.handleSubmit(async (values) => {
    const result = await registerForEvent({ eventId, people, ...values });
    if ("error" in result) return form.setError("root", { message: result.error.message });
    setSent(true);
  });

  if (sent) {
    return (
      <p role="status" className="text-sm">
        Ačiū, registraciją „{title}“ gavome. Susisieksime telefonu arba el. paštu.
      </p>
    );
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Stepper label="Žmonių" value={people} onChange={setPeople} min={1} max={20} />
        <ContactFields idPrefix={`reg-${eventId}`} />
        <Textarea placeholder="Komentaras (nebūtina)" aria-label="Komentaras" {...form.register("message")} />
        {form.formState.errors.root ? (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        ) : null}
        <ArrowButton type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Siunčiama..." : "Registruotis"}
        </ArrowButton>
      </form>
    </FormProvider>
  );
}
