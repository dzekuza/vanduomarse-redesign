import type { PaymentInfo } from "@/lib/admin/types";

/** Shown on a request that was paid online: money is already taken, so cancelling means a refund in Stripe. */
export function PaymentNote({ payment }: { payment?: PaymentInfo }) {
  if (payment?.status !== "apmoketa") return null;
  return (
    <p className="border border-line bg-card p-3 text-sm">
      Apmokėta internetu: {payment.amount} € už visą rezervaciją (kartu su kitomis jos užklausomis).
      {payment.needsReview ? " Mokėjimą reikia patikrinti Stripe." : ""} Jei užklausą atšauksite, pinigus grąžinkite Stripe paskyroje.
      {payment.refunded > 0 ? ` Jau grąžinta: ${payment.refunded} €.` : ""}
    </p>
  );
}
