"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { loadCurrentCustomer } from "@/app/actions/customer";
import { createInquiry } from "@/app/actions/requests";
import { ArrowButton } from "@/components/booking/arrow-button";
import { Cta } from "@/components/cta";
import { ContactFields } from "@/components/quads/contact-fields";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const form = useForm<MessageContactValues>({
    resolver: zodResolver(messageContactSchema),
    defaultValues: { customerName: "", customerPhone: "", customerEmail: "", website: "", message: "" },
  });

  // A signed-in customer gets their confirmed e-mail, phone and saved name filled in (never over what was already typed).
  useEffect(() => {
    if (!open) return;
    void loadCurrentCustomer()
      .then((customer) => {
        if (!customer) return;
        const fill = (field: "customerName" | "customerPhone" | "customerEmail", value: string | null) => {
          if (value && !form.getValues(field)) form.setValue(field, value);
        };
        fill("customerName", customer.name);
        fill("customerPhone", customer.phone);
        fill("customerEmail", customer.email);
      })
      .catch(() => undefined);
  }, [open, form]);

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
    setConfirmOpen(true);
  });

  if (sent) {
    return (
      <>
        <p role="status" className="text-sm">
          Ačiū, užklausą gavome. Susisieksime telefonu arba el. paštu.
        </p>
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="gap-0 rounded-none border-line bg-popover p-6 text-ink sm:max-w-md">
            <div className="space-y-3">
              <p className="text-micro uppercase text-copy">Skaičiuoklė</p>
              <DialogTitle className="font-display text-heading! font-bold uppercase">Užklausa išsiųsta</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-copy">
                Ačiū, užklausą gavome. Susisieksime telefonu arba el. paštu. Savo užklausas matysi ir skiltyje „Mano paskyra“, kai prisijungsi su tuo pačiu el. paštu ar telefonu.
              </DialogDescription>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
              <DialogClose asChild>
                <Cta tone="dark" small>Gerai</Cta>
              </DialogClose>
              <Link href="/paskyra" className="inline-flex min-h-11 items-center border-b border-current text-sm font-bold hover:text-rust-ink">
                Mano paskyra
              </Link>
            </div>
          </DialogContent>
        </Dialog>
      </>
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
