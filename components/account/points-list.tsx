import Link from "next/link";
import type { MyPoints } from "@/lib/account";
import { formatPoints, kindLabel } from "@/lib/points";

const dateLabel = (iso: string) => new Intl.DateTimeFormat("lt-LT", { dateStyle: "medium", timeZone: "Europe/Vilnius" }).format(new Date(iso));

/** The customer's points: the balance of each customer record on the account and its latest movements. */
export function PointsList({ points }: { points: MyPoints[] }) {
  if (points.length === 0) {
    return (
      <div className="space-y-3 border border-line p-5 sm:p-6">
        <p className="text-copy">Taškų dar neturite. Taškai skiriami už apmokėtus pirkinius internetu: rezervacijas, bilietus ir planus. Jie atsiras čia, jei paskyroje naudojamas tas pats telefonas ar el. paštas.</p>
        <Link href="/rezervacija" className="inline-flex min-h-11 items-center border-b border-current text-sm font-bold">
          Į rezervaciją
        </Link>
      </div>
    );
  }

  return (
    <section aria-label="Taškai" className="space-y-4">
      {points.map((p) => (
        <article key={p.riderId} aria-label={`Taškai: ${p.name}`} className="space-y-4 border border-line p-5 sm:p-6">
          <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h3 className="font-display text-heading font-bold uppercase">{points.length > 1 ? p.name : "Mano taškai"}</h3>
            <p className="text-heading font-bold tabular-nums">{formatPoints(p.balance)}</p>
          </header>
          {p.entries.length === 0 ? (
            <p className="text-sm text-copy">Judėjimų dar nėra.</p>
          ) : (
            <ul className="divide-y divide-line">
              {p.entries.map((e, i) => (
                <li key={`${e.at}-${i}`} className="flex items-start justify-between gap-4 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-bold">{kindLabel(e.kind)}</p>
                    {e.reason ? <p className="text-copy">{e.reason}</p> : null}
                    <p className="text-micro text-copy">{dateLabel(e.at)}</p>
                  </div>
                  <span className="shrink-0 font-bold tabular-nums">
                    {e.delta > 0 ? "+" : ""}
                    {e.delta}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </section>
  );
}
