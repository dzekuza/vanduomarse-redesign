import Link from "next/link";
import { PaymentPoller } from "@/components/reservation/payment-actions";
import { PaymentCard } from "@/components/reservation/payment-status";
import { MAIN_CONTACT } from "@/lib/contacts";

export interface PlanPaymentView {
  status: string;
  reference: string;
  planName: string;
  amount: number;
  hasEmail: boolean;
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
  const pending = order.status === "laukia_apmokejimo";
  const title = paid ? "Apmokėta. Abonementas tavo." : pending && !cancelled ? "Tikriname mokėjimą" : pending ? "Mokėjimas nebaigtas" : "Užsakymas atšauktas";
  const text = paid
    ? `Abonementas priskirtas tavo profiliui${order.hasEmail ? " ir patvirtinimą išsiuntėme el. paštu" : ""}. Atvykęs į parką, kasoje pasakyk savo vardą: darbuotojas priskirs apyrankę.`
    : pending && !cancelled
      ? "Laukiame Stripe patvirtinimo. Puslapis atsinaujins pats."
      : pending
        ? `Mokėjimas nebuvo atliktas. Užsakymas galioja trumpai; jei norite pabaigti, skambinkite ${MAIN_CONTACT.phone} arba užsakykite iš naujo.`
        : "Mokėjimas nebuvo atliktas arba grąžintas, abonementas nepriskirtas. Gali užsakyti iš naujo.";

  return (
    <PaymentCard title={title} text={text} refs={[order.reference]} amount={order.amount}>
      {pending && !cancelled ? <PaymentPoller /> : null}
      <Link href="/rezervacija?veikla=wake" className="inline-flex min-h-11 items-center text-sm font-normal text-ink/70 underline underline-offset-4 hover:text-rust">
        {paid ? "Grįžti į rezervaciją" : "Atgal į WAKE pasiūlymus"}
      </Link>
    </PaymentCard>
  );
}
