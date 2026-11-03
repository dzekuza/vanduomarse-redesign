import { telHref, MAIN_CONTACT } from "@/lib/contacts";
import type { PlanLine } from "@/lib/reservation";
import type { Outcome } from "./submit-reservation";

interface ReservationDoneProps {
  lines: PlanLine[];
  when: string;
  outcome: Outcome;
  busy: boolean;
  onRetry: () => void;
  onReset: () => void;
}

/** After submit: a reference per request, or what was sent and what still needs another try. */
export function ReservationDone({ lines, when, outcome, busy, onRetry, onReset }: ReservationDoneProps) {
  const { sent, error } = outcome;
  const pending = lines.some((l) => !sent[l.id]);
  return (
    <div className="border border-line bg-foam/15">
      <div className="border-b border-dashed border-ink px-6 py-4">
        <p className="font-display text-xl font-bold uppercase">{pending ? "Dar ne viskas išsiųsta" : "Gavom. Susisieksim."}</p>
        <p className="mt-1 text-sm text-ink/60">{when}</p>
      </div>
      <ul className="divide-y divide-line px-6">
        {lines.map((l) => (
          <li key={l.id} className="flex items-baseline justify-between gap-4 py-4">
            <span className="min-w-0">
              <span className="block font-medium">{l.title}</span>
              <span className="block text-sm text-ink/60">{l.detail}</span>
              {error?.activity === l.id ? <span role="alert" className="mt-1 block text-sm text-destructive">{error.message}</span> : null}
            </span>
            <span className="shrink-0 text-right">
              <span className="block font-display text-lg font-bold text-rust">{sent[l.id]?.reference ?? "-"}</span>
              <span className="block text-sm">{sent[l.id]?.total ?? l.price} €</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="border-t border-dashed border-ink px-6 py-4 text-sm text-ink/70">
        {pending
          ? `Išsiųstos užklausos jau pas mus, pakartojus jos nesiunčiamos antrą kartą. Reikia pagalbos? Skambink ${MAIN_CONTACT.phone}.`
          : "Užklausas gavome. Patvirtinsime telefonu arba el. paštu; kol kas vietos dar nėra garantuotos ir mokėti nereikia."}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink px-6 py-4">
        {pending ? (
          <button type="button" onClick={onRetry} disabled={busy} className="inline-flex min-h-11 items-center border-b border-current text-sm font-bold disabled:opacity-50">
            {busy ? "Siunčiama..." : "Bandyti dar kartą"}
          </button>
        ) : (
          <a href={telHref(MAIN_CONTACT.phone)} className="inline-flex min-h-11 items-center border-b border-current text-sm font-bold">
            Skambinti: {MAIN_CONTACT.phone}
          </a>
        )}
        <button type="button" onClick={onReset} className="inline-flex min-h-11 items-center text-sm font-medium text-ink/70 underline underline-offset-4 hover:text-rust">
          Rezervuoti iš naujo
        </button>
      </div>
    </div>
  );
}
