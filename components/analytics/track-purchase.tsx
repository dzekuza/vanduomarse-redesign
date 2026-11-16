"use client";

import { useEffect } from "react";
import { trackPurchase, type ActivityKind } from "@/lib/analytics";

interface TrackPurchaseProps {
  kind: ActivityKind;
  /** Stable per payment (the payment id or the order reference), so reloading the page never counts it twice. */
  transactionId: string;
  itemName?: string;
  value: number;
  /** Discount code used, so campaign sales (e.g. Black Friday) can be told apart in GA and Meta. */
  coupon?: string;
  /** What only this payer's return page has (reservation payment id or Stripe session id), so the server can check the sale before reporting it to Meta. */
  proof?: string;
}

/** Renders nothing: reports a paid return page to Google Analytics and the Meta Pixel once per browser session and transaction. */
export function TrackPurchase({ kind, transactionId, itemName, value, coupon, proof }: TrackPurchaseProps) {
  useEffect(() => {
    const key = `vm_purchase_${transactionId}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked: report it anyway; GA also de-duplicates purchases by transaction id.
    }
    trackPurchase(kind, transactionId, { itemName, value, coupon }, proof);
  }, [kind, transactionId, itemName, value, coupon, proof]);

  return null;
}
