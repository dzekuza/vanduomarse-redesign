import Link from "next/link";
import { MAIN_CONTACT, telHref } from "@/lib/contacts";
import { PayAgain, PaymentPoller } from "./payment-actions";

export interface PaymentView {
  id: string;
  status: string;
  amount: number;
  refs: string[];
  needsReview: boolean;
}

const LINK = "inline-flex min-h-11 items-center border-b border-current text-sm font-bold";

const COPY: Record<string, { title: string; text: string }> = {
  apmoketa: { title: "Apmokėta. Gavom.", text: "Mokėjimą gavome. Užklausas patvirtinsime telefonu arba el. paštu, patvirtinimą gausite ir SMS žinute." },
  laukia: { title: "Tikriname mokėjimą", text: "Laukiame Stripe patvirtinimo. Puslapis atsinaujins pats." },
  pasibaige: { title: "Mokėjimo laikas baigėsi", text: "Užklausos atšauktos ir vietos paleistos. Rezervuokite iš naujo." },
  nepavyko: { title: "Mokėjimas nepavyko", text: "Užklausos atšauktos ir vietos paleistos. Rezervuokite iš naujo." },
  grazinta: { title: "Mokėjimas grąžintas", text: "Pinigus grąžinome į jūsų kortelę; bankui to atvaizdavimas gali užtrukti kelias dienas." },
};

/** What happened to a reservation payment: paid, still being checked, cancelled at Stripe, expired or refunded. */
export function PaymentStatus({ payment, cancelled }: { payment: PaymentView | null; cancelled: boolean }) {
  if (!payment) {
    return (
      <PaymentCard title="Mokėjimas nerastas" text={`Nuoroda neteisinga arba pasenusi. Reikia pagalbos? Skambink ${MAIN_CONTACT.phone}.`}>
        <Link href="/rezervacija" className={LINK}>
          Į rezervaciją
        </Link>
      </PaymentCard>
    );
  }

  const open = payment.status === "laukia";
  const copy = cancelled && payment.status === "pasibaige"
    ? { title: "Mokėjimas nebaigtas", text: "Mokėjimas nebuvo atliktas, todėl vietų nelaikome. Rezervuokite iš naujo." }
    : open && cancelled
    ? { title: "Mokėjimas nebaigtas", text: "Mokėjimas nebuvo atliktas. Nepavyko iškart atlaisvinti vietų: jos bus atlaisvintos netrukus. Galite pabandyti dar kartą." }
    : (COPY[payment.status] ?? COPY.laukia);

  return (
    <PaymentCard title={copy.title} text={copy.text} refs={payment.refs} amount={payment.amount}>
      {open && !cancelled ? <PaymentPoller /> : null}
      {open && cancelled ? <PayAgain paymentId={payment.id} /> : null}
      {payment.needsReview ? (
        <p className="text-sm text-copy">Šį mokėjimą peržiūrės darbuotojai. Jei kils klausimų, skambink {MAIN_CONTACT.phone}.</p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {payment.status === "apmoketa" ? (
          <a href={telHref(MAIN_CONTACT.phone)} className={LINK}>
            Skambinti: {MAIN_CONTACT.phone}
          </a>
        ) : (
          <span />
        )}
        <Link href="/rezervacija" className="inline-flex min-h-11 items-center text-sm font-normal text-ink/70 underline underline-offset-4 hover:text-rust">
          {payment.status === "apmoketa" ? "Rezervuoti dar kartą" : "Atgal į rezervaciją"}
        </Link>
      </div>
    </PaymentCard>
  );
}

export function PaymentCard({ title, text, refs, amount, children }: { title: string; text: string; refs?: string[]; amount?: number; children?: React.ReactNode }) {
  return (
    <div className="max-w-xl border border-line bg-foam/15">
      <div className="border-b border-dashed border-ink px-6 py-4">
        <p className="font-display text-figure font-bold uppercase">{title}</p>
        {amount !== undefined ? <p className="mt-1 text-sm text-copy">{amount} €</p> : null}
      </div>
      {refs && refs.length > 0 ? (
        <ul className="divide-y divide-line px-6">
          {refs.map((ref) => (
            <li key={ref} className="py-3 font-display text-figure font-bold text-rust-ink">
              {ref}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="space-y-4 border-t border-dashed border-ink px-6 py-4">
        <p className="text-sm text-copy">{text}</p>
        {children}
      </div>
    </div>
  );
}
