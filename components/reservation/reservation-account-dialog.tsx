"use client";

import { useRef, type FormEvent } from "react";
import { ArrowButton } from "@/components/booking/arrow-button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Customer } from "@/lib/customer-types";
import type { CheckedDiscount } from "@/lib/discount-codes";
import type { PlanLine } from "@/lib/reservation";
import { AccountStep } from "./account-step";
import { DialogPhotoClose } from "./dialog-photo-close";
import { DiscountCodeField } from "./discount-code-field";
import { PlanSummary } from "./plan-summary";
import { ReservationSubmitDetails } from "./reservation-submit-details";

interface ReservationAccountDialogProps {
  open: boolean;
  onClose: () => void;
  onReturnToPlan?: () => void;
  customer: Customer | null;
  onCustomer: (customer: Customer | null) => void;
  lines: PlanLine[];
  total: number;
  discount: CheckedDiscount | null;
  /** Euros the applied code takes off `total`. */
  discountAmount: number;
  onDiscount: (discount: CheckedDiscount | null) => void;
  /** A code check is running; the final submit waits for it. */
  checkingCode: boolean;
  onCheckingCode: (checking: boolean) => void;
  payments: boolean;
  payOnSite: boolean;
  preview: boolean;
  ready: boolean;
  busy: boolean;
  redirecting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

/** Contact verification and final reservation stay in one popup above the selected plan. */
export function ReservationAccountDialog({ open, onClose, onReturnToPlan, customer, onCustomer, lines, total, discount, discountAmount, onDiscount, checkingCode, onCheckingCode, payments, payOnSite, preview, ready, busy, redirecting, onSubmit }: ReservationAccountDialogProps) {
  const returnFocus = useRef<HTMLElement | null>(null);
  const contactForm = useRef<HTMLFormElement>(null);
  const payTotal = Math.round((total - discountAmount) * 100) / 100;

  function dismiss() {
    if (!busy) onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) dismiss(); }}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-9/10 flex-col gap-0 overflow-hidden rounded-none border-line bg-popover p-0 text-ink sm:max-w-xl"
        onOpenAutoFocus={(event) => {
          returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          event.preventDefault();
          contactForm.current?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const target = returnFocus.current;
          if (target?.isConnected && target !== document.body && target.getClientRects().length > 0) target.focus({ preventScroll: true });
          else onReturnToPlan?.();
        }}
        onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }}
        onInteractOutside={(event) => { if (busy) event.preventDefault(); }}
      >
        <DialogPhotoClose disabled={busy} />
        <header className="shrink-0 space-y-3 p-6 pr-18">
          <DialogTitle className="font-display text-heading font-bold uppercase">Užbaik rezervaciją</DialogTitle>
          <DialogDescription className="text-copy">Patvirtink telefono numerį arba el. paštą vienkartiniu kodu.</DialogDescription>
        </header>
        <form ref={contactForm} onSubmit={onSubmit} noValidate className="min-h-0 space-y-6 overflow-y-auto p-6 pt-0">
          <section aria-label="Kontaktai" className="space-y-3">
            <p className="text-micro uppercase text-copy">01 / Kontaktai</p>
            <AccountStep customer={customer} onCustomer={onCustomer} />
          </section>
          <section aria-label="Tavo planas" className="space-y-3">
            <p className="text-micro uppercase text-copy">02 / Tavo planas</p>
            <PlanSummary lines={lines} total={total} discount={discount ? { code: discount.code, amount: discountAmount } : undefined} compact />
            {preview ? null : <DiscountCodeField discount={discount} amount={discountAmount} disabled={busy} onChange={onDiscount} onPending={onCheckingCode} />}
          </section>
          <ReservationSubmitDetails payments={payments} payOnSite={payOnSite} preview={preview} />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <button type="button" disabled={busy} onClick={dismiss} className="inline-flex min-h-11 items-center text-xs font-bold underline underline-offset-4 disabled:opacity-50">Keisti planą</button>
            <ArrowButton type="submit" disabled={!ready || busy || checkingCode}>
              {redirecting ? "Nukreipiame į mokėjimą..." : busy ? "Siunčiama..." : preview ? "Baigti peržiūrą" : payments && !payOnSite && payTotal > 0 ? `Mokėti ${payTotal} €` : "Rezervuoti"}
            </ArrowButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
