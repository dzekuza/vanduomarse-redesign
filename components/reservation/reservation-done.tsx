import { telHref, MAIN_CONTACT } from "@/lib/contacts";
import type { PlanLine } from "@/lib/reservation";
import type { Outcome } from "./submit-reservation";

interface ReservationDoneProps {
  /** Inside a narrow booking panel: tighter padding and rows that wrap instead of squeezing the text. */
  compact?: boolean;
  lines: PlanLine[];
  outcome: Outcome;
  payOnSite: boolean;
  busy: boolean;
  onRetry: () => void;
  onReset: () => void;
}

/** After submit: a reference per request, or what was sent and what still needs another try. */
export function ReservationDone({ compact, lines, outcome, payOnSite, busy, onRetry, onReset }: ReservationDoneProps) {
  const { sent, error } = outcome;
  const pending = lines.some((l) => !sent[l.id]);
  const pad = compact ? "px-4" : "px-6";
  return (
    <div className="border border-line bg-foam/15 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-97 motion-safe:duration-300 motion-safe:ease-out-strong">
      <div className={`border-b border-dashed border-ink ${pad} py-4`}>
        <p className="font-display text-figure font-bold uppercase">{pending ? "Dar ne viskas išsiųsta" : payOnSite ? "Patvirtinta. Iki pasimatymo!" : "Gavom. Susisieksim."}</p>
      </div>
      <ul className={`divide-y divide-line ${pad}`}>
        {lines.map((l) => (
          <li key={l.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 py-4">
            <span className="min-w-0 flex-1 basis-40">
              <span className="block font-normal">{l.title}</span>
              <span className="block text-sm text-copy">{l.detail}</span>
              <span className="block text-sm text-copy">{l.schedule}</span>
              {error?.activity === l.id ? <span role="alert" className="mt-1 block text-sm text-rust-ink">{error.message}</span> : null}
            </span>
            <span className="shrink-0 text-right">
              <span className="block font-display text-figure font-bold text-rust-ink">{sent[l.id]?.reference ?? "-"}</span>
              <span className="block text-sm">{sent[l.id]?.total ?? l.price} €</span>
            </span>
          </li>
        ))}
      </ul>
      <p className={`border-t border-dashed border-ink ${pad} py-4 text-sm text-copy`}>
        {pending
          ? `Išsiųstos užklausos jau pas mus, pakartojus jos nesiunčiamos antrą kartą. Reikia pagalbos? Skambink ${MAIN_CONTACT.phone}.`
          : payOnSite
            ? "Rezervacija patvirtinta, vietos užtikrintos. Atsiskaitysi vietoje grynais."
            : "Užklausas gavome. Patvirtinsime telefonu arba el. paštu; kol kas vietos dar nėra garantuotos ir mokėti nereikia."}
      </p>
      <div className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-ink ${pad} py-3`}>
        {pending ? (
          <button type="button" onClick={onRetry} disabled={busy} className="inline-flex min-h-11 items-center border-b border-current text-sm font-bold disabled:opacity-50">
            {busy ? "Siunčiama..." : "Bandyti dar kartą"}
          </button>
        ) : (
          <a href={telHref(MAIN_CONTACT.phone)} className="inline-flex min-h-11 items-center border-b border-current text-sm font-bold">
            Skambinti: {MAIN_CONTACT.phone}
          </a>
        )}
        <button type="button" onClick={onReset} className="inline-flex min-h-11 items-center text-sm font-normal text-ink/70 underline underline-offset-4 hover:text-rust">
          Rezervuoti iš naujo
        </button>
      </div>
    </div>
  );
}
