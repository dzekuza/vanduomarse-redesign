import Link from "next/link";
import { REQUEST_PAYMENT_TONE, REQUEST_STATUS_TONE, StatusTag } from "./status-tag";
import { PendingPaymentActions } from "@/components/reservation/payment-actions";
import { REQUEST_PAYMENT_LABEL, REQUEST_STATUS_LABEL, type MyRequest } from "@/lib/account";
import { longDateLabel } from "@/lib/sauna";

const dayLabel = (key: string) => {
  if (!key) return "";
  const [y, m, d] = key.split("-").map(Number);
  return longDateLabel(new Date(y, m - 1, d));
};

/** The customer's reservations, newest date first; each one with its reference, status and whether it was paid. */
export function RequestList({ requests, filtered = false }: { requests: MyRequest[]; /** Showing one category: the empty note says so instead of inviting a first booking. */ filtered?: boolean }) {
  return (
    <section aria-label="Rezervacijos" className="space-y-4">
      {requests.length === 0 ? (
        <div className="space-y-3 border border-line p-5 sm:p-6">
          <p className="text-copy">{filtered ? "Šioje skiltyje rezervacijų nėra." : "Rezervacijų dar nėra. Pasirink pirtį, nakvynę ar keturračius ir jos atsiras čia."}</p>
          <Link href="/rezervacija" className="inline-flex min-h-11 items-center border-b border-current text-sm font-bold">
            Rezervuoti
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-line border border-line">
          {requests.map((r) => (
            <li key={`${r.reference}-${r.id}`} className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 p-5">
              <div className="min-w-0 space-y-1">
                <p className="font-bold">{r.title}</p>
                <p className="text-sm text-copy">
                  {[dayLabel(r.date), r.detail].filter(Boolean).join(", ")}
                </p>
                <p className="text-sm">
                  <StatusTag tone={REQUEST_STATUS_TONE[r.status]} label={REQUEST_STATUS_LABEL[r.status]} />
                  {r.payment ? <StatusTag tone={REQUEST_PAYMENT_TONE[r.payment]} label={REQUEST_PAYMENT_LABEL[r.payment]} className="ml-2" /> : null}
                </p>
                {r.payment === "laukia" && r.paymentId ? <PendingPaymentActions paymentId={r.paymentId} /> : null}
              </div>
              <div className="text-right">
                <p className="font-display text-figure font-bold text-rust-ink">{r.reference}</p>
                <p className="text-sm">{r.total} €</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
