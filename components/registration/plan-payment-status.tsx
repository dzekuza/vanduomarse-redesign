import Link from "next/link";
import { TrackPurchase } from "@/components/analytics/track-purchase";
import { PaymentPoller } from "@/components/reservation/payment-actions";
import { PaymentCard } from "@/components/reservation/payment-status";
import { MAIN_CONTACT } from "@/lib/contacts";
import { formatPassCode } from "@/lib/plan-pass";

export interface PlanPaymentView {
  status: string;
  reference: string;
  planName: string;
  amount: number;
  hasEmail: boolean;
  /** Discount code on the order, if any (for campaign reporting). */
  discountCode?: string;
  /** A pass bought without registering (ADR-0109) instead of a plan attached to a registered rider. */
  isPass?: boolean;
  /** The pass code, shown once it is paid: the buyer says it at the park. */
  passCode?: string;
  /** The Stripe Checkout session id from the return URL: the payer's proof for the Conversions API. */
  sessionId: string;
}

const LINK = "inline-flex min-h-11 items-center border-b border-current text-sm font-bold";

/** Where Stripe sends a plan buyer back. It only reads the state; the webhook attaches the plan to the rider. */
export function PlanPaymentStatus({ order, cancelled }: { order: PlanPaymentView | null; cancelled: boolean }) {
  if (!order) {
    return (
      <PaymentCard title="Mokėjimas nerastas" text={`Nuoroda neteisinga arba pasenusi. Reikia pagalbos? Skambink ${MAIN_CONTACT.phone}.`}>
        <Link href="/vandenlentes" className={LINK}>
          Į vandenlentes
        </Link>
      </PaymentCard>
    );
  }

  const paid = order.status === "apmoketa";
  const pass = order.isPass === true;
  const pending = order.status === "laukia_apmokejimo";
  const title = paid ? (pass ? "Apmokėta. Abonementas tavo." : "Apmokėta. Planas tavo.") : pending && !cancelled ? "Tikriname mokėjimą" : pending ? "Mokėjimas nebaigtas" : "Užsakymas atšauktas";
  const text = paid && pass
    ? `Abonemento kodą ${order.hasEmail ? "išsiuntėme el. paštu ir " : ""}rodome čia. Užsiregistruok, o atvykęs į parką kasoje pasakyk kodą: darbuotojas priskirs abonementą ir apyrankę. Kodą gali perduoti ir draugui, kuriam perki.`
    : paid
    ? `Planas priskirtas tavo profiliui${order.hasEmail ? " ir patvirtinimą išsiuntėme el. paštu" : ""}. Atvykęs į parką, kasoje pasakyk savo vardą: darbuotojas priskirs apyrankę.`
    : pending && !cancelled
      ? "Laukiame Stripe patvirtinimo. Puslapis atsinaujins pats."
      : pending
        ? `Mokėjimas nebuvo atliktas. Užsakymas galioja trumpai; jei norite pabaigti, skambinkite ${MAIN_CONTACT.phone} arba užsakykite iš naujo.`
        : "Mokėjimas nebuvo atliktas arba grąžintas, planas nepriskirtas. Gali užsakyti iš naujo.";

  return (
    <PaymentCard
      title={title}
      text={text}
      refs={[order.reference]}
      amount={order.amount}
      details={
        paid && pass && order.passCode ? (
          <div className="border-t border-dashed border-ink px-6 py-4">
            <p className="text-micro uppercase text-copy">Abonemento kodas</p>
            <p className="mt-1 font-display text-figure font-bold tracking-wider">{formatPassCode(order.passCode)}</p>
          </div>
        ) : null
      }
    >
      {paid ? <TrackPurchase kind="plan" transactionId={order.reference} itemName={order.planName} value={order.amount} coupon={order.discountCode} proof={order.sessionId} /> : null}
      {pending && !cancelled ? <PaymentPoller /> : null}
      {paid && pass ? (
        <Link href="/registracija" className={LINK}>
          Užsiregistruoti dabar
        </Link>
      ) : null}
      <Link href="/rezervacija?veikla=wake" className="inline-flex min-h-11 items-center text-sm font-normal text-ink/70 underline underline-offset-4 hover:text-rust">
        {paid ? "Grįžti į rezervaciją" : "Atgal į WAKE pasiūlymus"}
      </Link>
    </PaymentCard>
  );
}
