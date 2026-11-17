import type { PaymentInfo, StaffPaymentMethod } from "@/lib/admin/types";

const METHOD_LABEL: Record<StaffPaymentMethod, string> = { grynais: "grynais", kortele: "kortele" };

interface PaymentNoteProps {
  payment?: PaymentInfo;
  /** A staff-entered request paid at entry: when and how. */
  paidAt?: string;
  method?: StaffPaymentMethod;
}

/**
 * Shown on a request that was paid online (money is already taken; cancelling offers a Stripe refund of its share, ADR-0081),
 * one waiting for its online payment (a staff-entered request whose payment link was e-mailed, ADR-0112), or one staff
 * recorded as paid at entry.
 */
export function PaymentNote({ payment, paidAt, method }: PaymentNoteProps) {
  if (payment?.status === "laukia") {
    return <p className="border border-line bg-card p-3 text-sm">Laukiama apmokėjimo internetu: {payment.amount} €. Apmokėjus rezervacija patvirtinama automatiškai.</p>;
  }
  if (payment?.status !== "apmoketa") {
    return paidAt ? <p className="border border-line bg-card p-3 text-sm">Sumokėta{method ? ` ${METHOD_LABEL[method]}` : ""} įvedant rezervaciją.</p> : null;
  }
  return (
    <p className="border border-line bg-card p-3 text-sm">
      Apmokėta internetu: {payment.amount} € už visą rezervaciją (kartu su kitomis jos užklausomis).
      {payment.needsReview ? " Mokėjimą reikia patikrinti Stripe." : ""} Atšaukiant užklausą galėsite iškart grąžinti jos sumą per Stripe.
      {payment.refunded > 0 ? ` Jau grąžinta: ${payment.refunded} €.` : ""}
    </p>
  );
}
