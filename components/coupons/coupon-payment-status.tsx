import Link from "next/link";
import { PaymentCard } from "@/components/reservation/payment-status";
import { PaymentPoller } from "@/components/reservation/payment-actions";
import { CouponCodeActions } from "@/components/coupons/coupon-code-actions";
import { MAIN_CONTACT } from "@/lib/contacts";
import { formatCode, formatExpiry, type CouponStatus } from "@/lib/coupons";

export interface CouponPaymentView {
  status: CouponStatus;
  reference: string;
  productName: string;
  amount: number;
  hasRecipient: boolean;
  /** Only set once the coupon is paid. */
  code: string | null;
  /** yyyy-mm-dd, set with the code. */
  expiresAt: string | null;
  sessionId: string;
}

const LINK = "inline-flex min-h-11 items-center border-b border-current text-sm font-bold";

/** Where Stripe sends a coupon buyer back. It only reads the state; the webhook issues the code and emails it. */
export function CouponPaymentStatus({ coupon }: { coupon: CouponPaymentView | null }) {
  if (!coupon) {
    return (
      <PaymentCard title="Mokėjimas nerastas" text={`Nuoroda neteisinga arba pasenusi. Reikia pagalbos? Skambink ${MAIN_CONTACT.phone}.`}>
        <Link href="/kuponai" className={LINK}>
          Į kuponus
        </Link>
      </PaymentCard>
    );
  }

  const paid = coupon.status === "aktyvus" || coupon.status === "panaudotas";
  const pending = coupon.status === "laukia_apmokejimo";
  const title = paid ? "Apmokėta. Kuponas jūsų." : pending ? "Tikriname mokėjimą" : "Užsakymas atšauktas";
  const text = paid
    ? `Kupono kodą išsiuntėme į jūsų el. paštą${coupon.hasRecipient ? " ir gavėjui" : ""}. Jei laiško nematote, patikrinkite šiukšliadėžę, paspauskite „Siųsti dar kartą“ arba skambinkite ${MAIN_CONTACT.phone}.`
    : pending
      ? "Laukiame Stripe patvirtinimo. Puslapis atsinaujins pats."
      : "Mokėjimas nebuvo atliktas arba grąžintas, kuponas neišduotas. Galite užsakyti iš naujo.";

  return (
    <PaymentCard title={title} text={text} refs={[coupon.reference]} amount={coupon.amount}>
      {pending ? <PaymentPoller /> : null}
      {paid && coupon.code ? (
        <div className="space-y-4">
          <div className="border border-dashed border-ink px-4 py-4">
            <p className="text-micro uppercase text-copy">Kupono kodas</p>
            <p className="wrap-anywhere select-all font-display text-figure font-bold text-rust-ink sm:text-total">{formatCode(coupon.code)}</p>
            {coupon.expiresAt ? <p className="mt-1 text-sm text-copy">Galioja iki {formatExpiry(coupon.expiresAt)}</p> : null}
          </div>
          <CouponCodeActions code={formatCode(coupon.code)} sessionId={coupon.sessionId} />
        </div>
      ) : null}
      <Link href="/kuponai" className="inline-flex min-h-11 items-center text-sm font-normal text-ink/70 underline underline-offset-4 hover:text-rust">
        {paid ? "Užsakyti dar vieną kuponą" : "Atgal į kuponus"}
      </Link>
    </PaymentCard>
  );
}
