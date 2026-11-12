"use client";

import { CopyIcon, DownloadSimpleIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { useTransition } from "react";
import { toast } from "sonner";
import { CouponStatusBadge } from "../status-badge";
import { CouponActions } from "./coupon-actions";
import { formatDateTime } from "@/lib/admin/format";
import type { Coupon } from "@/lib/admin/types";
import { COUPON_SERVICE_LABEL, formatCode, formatEuro, formatExpiry } from "@/lib/coupons";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CustomerLink } from "../customer-link";
import { useAdmin } from "../admin-store";

interface CouponSheetProps {
  coupon: Coupon | null;
  onOpenChange: (open: boolean) => void;
}

/** Order details, the code, redemption history and the actions the current status allows. */
export function CouponSheet({ coupon, onOpenChange }: CouponSheetProps) {
  const { couponPdf } = useAdmin();
  const [downloading, startDownload] = useTransition();

  /** Builds the voucher PDF on the server and saves it in the browser. */
  const download = (id: string) =>
    startDownload(async () => {
      const result = await couponPdf(id);
      if ("error" in result) return;
      const bytes = Uint8Array.from(atob(result.data.base64), (ch) => ch.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = result.data.fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    });

  return (
    <Sheet open={!!coupon} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {coupon ? (
          <>
            <SheetHeader>
              <SheetTitle>{coupon.productName}</SheetTitle>
              <SheetDescription>
                {coupon.reference} · {formatDateTime(coupon.createdAt)}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 px-4 pb-6">
              <CouponStatusBadge status={coupon.status} />

              {coupon.code ? (
                <div className="flex items-center justify-between gap-3 border bg-muted px-4 py-3">
                  <p className="font-mono text-figure tracking-wide">{formatCode(coupon.code)}</p>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Kopijuoti kodą"
                    onClick={() => {
                      navigator.clipboard.writeText(formatCode(coupon.code!));
                      toast.success("Kodas nukopijuotas");
                    }}
                  >
                    <CopyIcon size={18} />
                  </Button>
                </div>
              ) : null}

              <dl className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ["Vertė", formatEuro(coupon.faceValue)],
                  ["Likutis", formatEuro(coupon.balance)],
                  ["Galioja", COUPON_SERVICE_LABEL[coupon.service]],
                  ["Iki", coupon.expiresAt ? formatExpiry(coupon.expiresAt) : "po apmokėjimo"],
                  ...(coupon.refundedAmount > 0 ? [["Grąžinta pirkėjui", formatEuro(coupon.refundedAmount)]] : []),
                  ["Gavėjas", coupon.recipientName || "-"],
                  ["Gavėjo el. paštas", coupon.recipientEmail || "-"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="mt-0.5 font-normal">{v}</dd>
                  </div>
                ))}
              </dl>

              {coupon.message ? <blockquote className="border-l-2 border-rust pl-3 text-sm">{coupon.message}</blockquote> : null}

              <div className="space-y-1 border-t pt-4 text-sm">
                <p className="font-medium">
                  <CustomerLink name={coupon.buyer.name} riderId={coupon.riderId} email={coupon.buyer.email} />
                </p>
                <a
                  href={`mailto:${coupon.buyer.email}?subject=${encodeURIComponent(`Dėl kupono ${coupon.reference}`)}`}
                  className="flex min-h-11 items-center gap-2 hover:text-rust"
                >
                  <EnvelopeSimpleIcon size={18} /> {coupon.buyer.email}
                </a>
              </div>

              {coupon.code && coupon.status !== "laukia_apmokejimo" ? (
                <Button variant="outline" className="min-h-11 w-full" disabled={downloading} onClick={() => download(coupon.id)}>
                  <DownloadSimpleIcon size={18} /> {downloading ? "Ruošiama..." : "Atsisiųsti PDF"}
                </Button>
              ) : null}

              <CouponActions coupon={coupon} />

              {coupon.redemptions.length ? (
                <div className="space-y-2 border-t pt-4">
                  <p className="text-sm font-medium">Panaudojimai</p>
                  <ul className="space-y-2">
                    {coupon.redemptions.map((r) => (
                      <li key={r.id} className="flex items-baseline justify-between gap-3 bg-muted p-3 text-sm">
                        <span>
                          <span className="block text-xs text-muted-foreground">{formatDateTime(r.at)}</span>
                          {r.note || "Be pastabos"}
                        </span>
                        <span className="font-display font-bold">−{formatEuro(r.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
