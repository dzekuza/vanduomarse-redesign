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
 * firing on load (when nothing may be sent yet). GA fires once analytics is allowed and Meta once marketing is,
 * each on its own, so a later change of choice still reports to the tracker that was just allowed.
 */
export function TrackViewItem({ kind, itemName, value, coupon }: TrackViewItemProps) {
  const { choice } = useConsent();
  // GA and Meta each fire once, when their own consent is given: allowing marketing later still sends ViewContent.
  const sent = useRef({ ga: false, meta: false });
  const analytics = choice?.analytics === true;
  const marketing = choice?.marketing === true;

  useEffect(() => {
    const ga = analytics && !sent.current.ga;
    const meta = marketing && !sent.current.meta;
    if (!ga && !meta) return;
    sent.current = { ga: sent.current.ga || ga, meta: sent.current.meta || meta };
    trackViewItem(kind, { itemName, value, coupon }, { ga, meta });
  }, [analytics, marketing, kind, itemName, value, coupon]);

  return null;
}
