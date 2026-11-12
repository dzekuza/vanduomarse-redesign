"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { RedeemForm } from "./redeem-form";
import type { Coupon } from "@/lib/admin/types";
import { formatCode, formatEuro } from "@/lib/coupons";
import { Button } from "@/components/ui/button";

/** What staff can do with a coupon in its current status. Spent and cancelled coupons are history only. */
export function CouponActions({ coupon }: { coupon: Coupon }) {
  const { activateCoupon, resendCouponEmail, cancelCoupon, refundCoupon } = useAdmin();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [pending, startTransition] = useTransition();

  if (coupon.status === "panaudotas") return null;

  if (coupon.status === "atsauktas") {
    if (!coupon.paidOnline) return null;
    if (coupon.refundedAmount > 0) {
      return <p className="border-t pt-4 text-sm">Pinigai grąžinti: {formatEuro(coupon.refundedAmount)}.</p>;
    }
    // The unspent share of what the buyer paid (same rule as the server).
    const refundable = Math.round(((coupon.paidAmount * Math.min(coupon.balance, coupon.faceValue)) / coupon.faceValue) * 100) / 100;
    if (refundable < 0.01) return null;
    return (
      <div className="space-y-2 border-t pt-4">
        {confirmRefund ? (
          <div className="space-y-2 border border-destructive/40 p-3">
            <p className="text-sm">
              Grąžinti {formatEuro(refundable)} pirkėjui į kortelę per Stripe? Pinigai pasirodo per kelias darbo dienas. Veiksmo atšaukti negalima.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setConfirmRefund(false)} disabled={pending} className="min-h-11 flex-1">
                Palikti
              </Button>
              <Button
                variant="destructive"
                disabled={pending}
                className="min-h-11 flex-1"
                onClick={() =>
                  startTransition(async () => {
                    const result = await refundCoupon(coupon.id);
                    setConfirmRefund(false);
                    if ("data" in result) toast.success(`Grąžinta ${formatEuro(result.data.refunded)}`);
                  })
                }
              >
                {pending ? "Vykdoma..." : `Grąžinti ${formatEuro(refundable)}`}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setConfirmRefund(true)} className="min-h-11 w-full">
            Grąžinti pinigus ({formatEuro(refundable)})
          </Button>
        )}
      </div>
    );
  }

  const activate = () =>
    startTransition(async () => {
      const result = await activateCoupon(coupon.id);
      if ("error" in result) return;
      const { code, emailSent } = result.data;
      toast.success(
        emailSent
          ? `Apmokėta. Kodas ${formatCode(code)} išsiųstas ${coupon.buyer.email}.`
          : `Apmokėta. Kodas ${formatCode(code)}. El. laiškas neišsiųstas: perduokite kodą pirkėjui patys.`,
        { duration: 10000 },
      );
    });

  const resend = () =>
    startTransition(async () => {
      const result = await resendCouponEmail(coupon.id);
      if ("error" in result) return;
      if (result.data.emailSent) toast.success(`Kodas išsiųstas ${coupon.buyer.email}`);
      else toast.error("El. laiškas neišsiųstas: patikrinkite RESEND_API_KEY ir COUPON_FROM_EMAIL.");
    });

  return (
    <div className="space-y-4 border-t pt-4">
      {coupon.status === "laukia_apmokejimo" ? (
        <Button onClick={activate} disabled={pending} className="min-h-11 w-full">
          {pending ? "Vykdoma..." : "Pažymėti apmokėtu ir išsiųsti kodą"}
        </Button>
      ) : (
        <>
          <RedeemForm key={`${coupon.id}-${coupon.balance}`} coupon={coupon} />
          <Button variant="outline" onClick={resend} disabled={pending} className="min-h-11 w-full">
            Siųsti kodą dar kartą
          </Button>
        </>
      )}

      {confirmCancel ? (
        <div className="space-y-2 border border-destructive/40 p-3">
          <p className="text-sm">
            {coupon.status === "aktyvus"
              ? `Atšaukus kuponas nebegalios, o likutis nebus panaudojamas.${coupon.paidOnline ? " Pinigai automatiškai negrąžinami: po atšaukimo galėsite juos grąžinti." : ""}`
              : "Atšaukti šį užsakymą?"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setConfirmCancel(false)} className="min-h-11 flex-1">
              Palikti
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                cancelCoupon(coupon.id);
                toast.success("Kuponas atšauktas");
                setConfirmCancel(false);
              }}
              className="min-h-11 flex-1"
            >
              Atšaukti
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" onClick={() => setConfirmCancel(true)} className="min-h-11 w-full text-destructive">
          Atšaukti {coupon.status === "aktyvus" ? "kuponą" : "užsakymą"}
        </Button>
      )}
    </div>
  );
}
