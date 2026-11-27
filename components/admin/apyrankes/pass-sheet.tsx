"use client";

import { EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { useTransition } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { copyPaymentLink } from "../bookings/payment-form";
import { CustomerLink } from "../customer-link";
import { formatDateTime, formatEur } from "@/lib/admin/format";
import type { PlanPass } from "@/lib/admin/types";
import {
  formatPassCode,
  passOwedAmount,
  passPaidAmount,
  PASS_STATUS_LABELS,
} from "@/lib/plan-pass";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface PassSheetProps {
  pass: PlanPass | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * A WAKE pass bought online (ADR-0109) as a sale: who bought it, what it cost, what came in and what is still owed. A pass
 * paid in parts and waiting for its balance (ADR-0139) offers the balance link, by e-mail or to copy.
 */
export function PassSheet({ pass, onOpenChange }: PassSheetProps) {
  return (
    <Sheet open={!!pass} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {pass ? (
          <>
            <SheetHeader>
              <SheetTitle>{pass.planName}</SheetTitle>
              <SheetDescription>
                {pass.reference} ·{" "}
                {formatDateTime(pass.paidAt ?? pass.createdAt)}
              </SheetDescription>
            </SheetHeader>
            <PassDetails pass={pass} />
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function PassDetails({ pass }: { pass: PlanPass }) {
  const paid = passPaidAmount(pass);
  const owed = passOwedAmount(pass);
  const split = pass.paymentPlan === "dalimis";
  const rows: [string, string][] = [
    ["Abonementas", pass.planName],
    [
      "Kaina",
      `${formatEur(pass.price)}${pass.discountCode ? ` (${pass.discountCode})` : ""}`,
    ],
    ["Mokėjimas", split ? "Dalimis: 50 % + 50 %" : "Visa suma"],
    ["Apmokėta", formatEur(paid)],
    ["Liko sumokėti", formatEur(owed)],
    ...(split
      ? [
          [
            "Pirmoji dalis",
            `${formatEur(pass.depositAmount ?? 0)}${pass.depositRefundedAt ? " (grąžinta)" : ""}`,
          ] as [string, string],
        ]
      : []),
    ...(split
      ? [
          [
            "Likutis",
            `${formatEur(pass.balanceAmount ?? 0)}${pass.balancePaidAt ? ` · apmokėta ${formatDateTime(pass.balancePaidAt)}` : pass.balanceRefundedAt ? " (grąžinta)" : ""}`,
          ] as [string, string],
        ]
      : []),
    [
      "Kodas",
      pass.code && (pass.status === "apmoketa" || pass.status === "priskirtas")
        ? formatPassCode(pass.code)
        : "Dar neišduotas",
    ],
  ];

  return (
    <div className="space-y-6 px-4 pb-6">
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{PASS_STATUS_LABELS[pass.status]}</Badge>
        {pass.gift ? (
          <Badge variant="outline">
            Dovana{pass.recipientName ? `: ${pass.recipientName}` : ""}
          </Badge>
        ) : null}
        {pass.refundedAt ? <Badge variant="outline">Grąžinta</Badge> : null}
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="mt-0.5 font-normal">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="space-y-1 border-t pt-4 text-sm">
        <p className="font-medium">
          <CustomerLink
            name={pass.buyerName}
            riderId={pass.riderId ?? undefined}
            email={pass.buyerEmail}
          />
        </p>
        <a
          href={`mailto:${pass.buyerEmail}?subject=${encodeURIComponent(`Dėl abonemento ${pass.reference}`)}`}
          className="flex min-h-11 items-center gap-2 hover:text-rust"
        >
          <EnvelopeSimpleIcon size={18} /> {pass.buyerEmail}
        </a>
      </div>

      {pass.status === "dalinai_apmoketa" && owed > 0 ? (
        <BalanceActions pass={pass} owed={owed} />
      ) : null}
    </div>
  );
}

/** "Siųsti likučio nuorodą" / "Kopijuoti nuorodą", like the staff payment link buttons (ADR-0113). */
function BalanceActions({ pass, owed }: { pass: PlanPass; owed: number }) {
  const { getPassBalanceLink } = useAdmin();
  const [pending, startTransition] = useTransition();

  const send = () =>
    startTransition(async () => {
      const result = await getPassBalanceLink(pass.id, "email");
      if (!("data" in result)) return;
      if (result.data.emailSent) toast.success("Likučio nuoroda išsiųsta");
      else
        toast.warning("Laiško išsiųsti nepavyko. Nukopijuokite nuorodą.", {
          action: {
            label: "Kopijuoti",
            onClick: () => void copyPaymentLink(result.data.url),
          },
        });
    });
  const copy = () =>
    startTransition(async () => {
      const result = await getPassBalanceLink(pass.id, "copy");
      if ("data" in result) await copyPaymentLink(result.data.url);
    });

  return (
    <div className="space-y-2 border border-line p-3">
      <p className="text-sm font-medium">Likutis: {formatEur(owed)}</p>
      <p className="text-sm text-muted-foreground">
        Nuoroda galioja parą. Kodas išsiunčiamas pirkėjui, kai likutis
        apmokamas.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button className="min-h-11 flex-1" disabled={pending} onClick={send}>
          Siųsti likučio nuorodą
        </Button>
        <Button
          variant="outline"
          className="min-h-11 flex-1"
          disabled={pending}
          onClick={copy}
        >
          Kopijuoti nuorodą
        </Button>
      </div>
    </div>
  );
}
