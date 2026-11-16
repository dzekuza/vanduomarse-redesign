"use client";

import { useEffect, useRef } from "react";
import { useConsent } from "@/hooks/use-consent";
import { trackViewItem, type ActivityKind } from "@/lib/analytics";

interface TrackViewItemProps {
  kind: ActivityKind;
  itemName: string;
  /** Euros including VAT, after any discount shown on the page. */
  value: number;
  coupon?: string;
}

/**
 * Renders nothing: reports that a visitor opened a page where they can buy something, once per page view.
 * Someone arriving from an ad usually answers the cookie banner first, so this waits for that answer instead of
 * firing on load (when nothing may be sent yet) and fires as soon as analytics or marketing is allowed.
 */
export function TrackViewItem({ kind, itemName, value, coupon }: TrackViewItemProps) {
  const { choice } = useConsent();
  const sent = useRef(false);
  const allowed = Boolean(choice?.analytics || choice?.marketing);

  useEffect(() => {
    if (!allowed || sent.current) return;
    sent.current = true;
    trackViewItem(kind, { itemName, value, coupon });
  }, [allowed, kind, itemName, value, coupon]);

  return null;
}
