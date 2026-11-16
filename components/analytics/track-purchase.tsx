"use client";

import { useEffect } from "react";
import { useConsent } from "@/hooks/use-consent";
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

const TRACKERS = ["ga", "meta"] as const;

/** Whether this browser session already reported the purchase to one tracker; storage errors count as "not yet". */
function alreadySent(tracker: string, transactionId: string): boolean {
  try {
    return window.sessionStorage.getItem(`vm_purchase_${tracker}_${transactionId}`) !== null;
  } catch {
    return false;
  }
}

function markSent(tracker: string, transactionId: string): void {
  try {
    window.sessionStorage.setItem(`vm_purchase_${tracker}_${transactionId}`, "1");
  } catch {
    // Storage blocked: report it anyway; GA de-duplicates by transaction id and Meta by event id.
  }
}

/**
 * Renders nothing: reports a paid return page to Google Analytics and the Meta Pixel, each once per browser session and
 * transaction, as soon as that tracker's consent is given. A buyer who answers the cookie banner on this page is still
 * counted, and allowing marketing after analytics still reaches Meta.
 */
export function TrackPurchase({ kind, transactionId, itemName, value, coupon, proof }: TrackPurchaseProps) {
  const { choice } = useConsent();
  const analytics = choice?.analytics === true;
  const marketing = choice?.marketing === true;

  useEffect(() => {
    const allowed = { ga: analytics, meta: marketing };
    const to = { ga: false, meta: false };
    for (const tracker of TRACKERS) {
      if (!allowed[tracker] || alreadySent(tracker, transactionId)) continue;
      markSent(tracker, transactionId);
      to[tracker] = true;
    }
    if (to.ga || to.meta) trackPurchase(kind, transactionId, { itemName, value, coupon }, proof, to);
  }, [analytics, marketing, kind, transactionId, itemName, value, coupon, proof]);

  return null;
}
