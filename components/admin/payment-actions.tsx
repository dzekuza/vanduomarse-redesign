"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useAdmin } from "./admin-store";
import { copyPaymentLink } from "./bookings/payment-form";
import type { BookingSource, BookingStatus, PaymentInfo } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface PaymentActionsProps {
  kind: "booking" | "rental" | "ticket";
  id: string;
  status: BookingStatus;
  source?: BookingSource;
  payment?: PaymentInfo;
  /** Paid at entry already. */
  paidAt?: string;
  /** The customer's e-mail; without it the link can only be copied. */
  email: string;
}

/**
 * For a staff-entered request that is not paid (ADR-0113): send the Stripe payment link again, copy it, or record the request
 * as paid at entry (cash or card). Website requests are paid by the customer, so nothing shows for them, nor for cancelled
 * or already paid requests.
 */
export function PaymentActions({ kind, id, status, source, payment, paidAt, email }: PaymentActionsProps) {
  const { getPaymentLink, markRequestPaid } = useAdmin();
  const [pending, startTransition] = useTransition();
  if (!source || source === "svetaine" || status === "atsaukta" || paidAt || payment?.status === "apmoketa" || payment?.status === "grazinta") return null;

  const send = () =>
    startTransition(async () => {
      const result = await getPaymentLink(kind, id, "email");
      if (!("data" in result)) return;
      if (result.data.emailSent) toast.success("Apmokėjimo nuoroda išsiųsta");
      else toast.warning("Laiško išsiųsti nepavyko. Nukopijuokite nuorodą.", { action: { label: "Kopijuoti", onClick: () => void copyPaymentLink(result.data.url) } });
    });
  const copy = () =>
    startTransition(async () => {
      const result = await getPaymentLink(kind, id, "copy");
      if ("data" in result) await copyPaymentLink(result.data.url);
    });
  const markPaid = (method: "grynais" | "kortele") =>
    startTransition(async () => {
      const result = await markRequestPaid(kind, id, method);
      if ("data" in result) toast.success(`Pažymėta: sumokėta ${method === "grynais" ? "grynais" : "kortele"}`);
    });

  return (
    <div className="space-y-2 border border-line p-3">
      <p className="text-sm font-medium">Apmokėjimas: nesumokėta</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="min-h-11 flex-1" disabled={pending || !email.trim()} title={email.trim() ? undefined : "Rezervacijoje nėra el. pašto"} onClick={send}>
          Siųsti nuorodą
        </Button>
        <Button variant="outline" className="min-h-11 flex-1" disabled={pending} onClick={copy}>
          Kopijuoti nuorodą
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="min-h-11 flex-1" disabled={pending}>
              Pažymėti sumokėta
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="min-h-11" onSelect={() => markPaid("grynais")}>
              Grynais
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11" onSelect={() => markPaid("kortele")}>
              Kortele
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
