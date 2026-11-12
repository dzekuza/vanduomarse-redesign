import type { PaymentInfo } from "@/lib/admin/types";

/** Shown on a request that was paid online: money is already taken; cancelling offers a Stripe refund of its share (ADR-0081). */
export function PaymentNote({ payment }: { payment?: PaymentInfo }) {
  if (payment?.status !== "apmoketa") return null;
  return (
    <p className="border border-line bg-card p-3 text-sm">
      Apmokėta internetu: {payment.amount} € už visą rezervaciją (kartu su kitomis jos užklausomis).
      {payment.needsReview ? " Mokėjimą reikia patikrinti Stripe." : ""} Atšaukiant užklausą galėsite iškart grąžinti jos sumą per Stripe.
      {payment.refunded > 0 ? ` Jau grąžinta: ${payment.refunded} €.` : ""}
    </p>
  );
}
