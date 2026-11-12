"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useAdmin } from "./admin-store";
import { CancelRefundDialog } from "./cancel-refund-dialog";
import { refundableAmount } from "@/lib/admin/refund";
import type { PaymentInfo } from "@/lib/admin/types";

export type CancelKind = "booking" | "rental" | "ticket";

export interface CancelTarget {
  id: string;
  reference: string;
  total: number;
  payment?: PaymentInfo;
}

/**
 * Cancelling a request. When it was paid online, staff first choose whether to refund its share through Stripe
 * (ADR-0081); otherwise it is cancelled at once. Render `dialog` next to the button that calls `cancel`.
 */
export function useCancelRequest(kind: CancelKind): { cancel: (target: CancelTarget) => Promise<unknown>; dialog: ReactNode } {
  const { cancelRequest } = useAdmin();
  const [target, setTarget] = useState<CancelTarget | null>(null);
  const [busy, setBusy] = useState(false);

  const cancel = async (next: CancelTarget) => {
    if (refundableAmount(next.payment, next.total) > 0) {
      setTarget(next);
      return;
    }
    const result = await cancelRequest(kind, next.id, false);
    if ("data" in result) toast.success(`${next.reference}: atšaukta`);
    return result;
  };

  const choose = async (refund: boolean) => {
    if (!target) return;
    setBusy(true);
    try {
      const result = await cancelRequest(kind, target.id, refund);
      if ("data" in result && !refund) toast.success(`${target.reference}: atšaukta`);
    } finally {
      setBusy(false);
      setTarget(null);
    }
  };

  const dialog = target ? (
    <CancelRefundDialog open reference={target.reference} refundable={refundableAmount(target.payment, target.total)} busy={busy} onChoose={(refund) => void choose(refund)} onClose={() => setTarget(null)} />
  ) : null;

  return { cancel, dialog };
}
