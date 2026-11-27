"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { loadCurrentCustomer } from "@/app/actions/customer";
import { createInquiry } from "@/app/actions/requests";
import { ArrowButton } from "@/components/booking/arrow-button";
import { BookingPrice } from "@/components/booking/booking-price";
import { Cta } from "@/components/cta";
import { ContactFields } from "@/components/quads/contact-fields";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trackLead } from "@/lib/analytics";
import { formatMoney, type Money } from "@/lib/event-pricing";
import { messageContactSchema, type InquiryInput, type MessageContactValues } from "@/lib/request-schema";

/** Everything an inquiry stores apart from the contact fields and the visitor's comment. */
export type QuoteRequest = Omit<InquiryInput, "customerName" | "customerPhone" | "customerEmail" | "website" | "message">;

interface QuoteRequestFormProps {
  /** Built when the visitor sends, so it carries the latest choices. */
  request: () => QuoteRequest;
  /** Lines put before the visitor's comment in the stored message. */
  messageLines?: () => string[];
  total: Money;
  /** Small caption on the confirmation dialog, e.g. "Skaičiuoklė". */
  kicker: string;
  idPrefix: string;
  disabled?: boolean;
}

/** "Siųsti užklausą": contact fields and a comment, stored with `create_inquiry` for /admin/uzklausos. Shared by the event calculator and the CIONGO packages. */
export function QuoteRequestForm({ request, messageLines, total, kicker, idPrefix, disabled }: QuoteRequestFormProps) {
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
    const details = request();
    const result = await createInquiry({
      ...contact,
      ...details,
      message: [...(messageLines?.() ?? []), message].filter(Boolean).join("\n\n"),
    });
    if ("error" in result) return form.setError("root", { message: result.error.message });
    trackLead("event_inquiry", { itemName: details.eventType, value: (details.estimateMin + details.estimateMax) / 2 });
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
              <p className="text-micro uppercase text-copy">{kicker}</p>
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

  if (!open) return <ArrowButton fullWidth disabled={disabled} onClick={() => setOpen(true)}>Siųsti užklausą</ArrowButton>;

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <ContactFields idPrefix={idPrefix} />
        <Textarea placeholder="Komentaras (nebūtina)" aria-label="Komentaras" {...form.register("message")} />
        {form.formState.errors.root ? (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        ) : null}
        <BookingPrice label="Preliminari kaina, su PVM" amount={formatMoney(total)} />
        <ArrowButton fullWidth type="submit" disabled={disabled || form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Siunčiama..." : "Siųsti užklausą"}
        </ArrowButton>
      </form>
    </FormProvider>
  );
}
