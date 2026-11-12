import Link from "next/link";
import { StatusTag } from "./status-tag";
import { CouponCodeActions } from "@/components/coupons/coupon-code-actions";
import type { MyCoupon } from "@/lib/account";
import { COUPON_SERVICE_LABEL, COUPON_STATUS_LABEL, formatCode, formatEuro, formatExpiry } from "@/lib/coupons";

const isExpired = (c: MyCoupon) => c.status === "aktyvus" && !!c.expiresAt && c.expiresAt < new Date().toISOString().slice(0, 10);

/** The customer's gift coupons: bought by them or sent to them, each with its code, balance and expiry. */
export function CouponList({ coupons }: { coupons: MyCoupon[] }) {
  if (coupons.length === 0) {
    return (
      <div className="space-y-3 border border-line p-5 sm:p-6">
        <p className="text-copy">Dovanų kuponų šiai paskyrai dar nėra. Pirkti ar gauti kuponai atsiras čia, jei paskyroje naudojamas tas pats el. paštas.</p>
        <Link href="/kuponai" className="inline-flex min-h-11 items-center border-b border-current text-sm font-bold">
          Į dovanų kuponus
        </Link>
      </div>
    );
  }

  return (
    <section aria-label="Dovanų kuponai" className="space-y-4">
      {coupons.map((c) => {
        const expired = isExpired(c);
        const label = expired ? "Pasibaigęs" : COUPON_STATUS_LABEL[c.status];
        return (
          <article key={c.reference} aria-label={`Kuponas ${c.reference}`} className="space-y-4 border border-line p-5 sm:p-6">
            <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
              <div className="min-w-0 space-y-1">
                <p className="text-micro uppercase text-copy">
                  {c.role === "recipient" ? `Dovana nuo ${c.buyerName}` : c.recipientName ? `Dovana: ${c.recipientName}` : "Jūsų kuponas"}
                </p>
                <h3 className="font-display text-heading font-bold uppercase">{c.productName}</h3>
                <p className="text-sm">
                  <StatusTag tone={expired ? "closed" : c.status === "aktyvus" ? "confirmed" : "done"} label={label} />
                  <span className="ml-2 border border-line px-2 py-0.5">{COUPON_SERVICE_LABEL[c.service]}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-figure font-bold text-rust-ink">{c.reference}</p>
                <p className="text-sm">
                  Likutis {formatEuro(c.balance)} / {formatEuro(c.faceValue)}
                </p>
              </div>
            </header>

            {c.message ? <blockquote className="border-l-4 border-rust py-1 pl-4 text-sm">{c.message}</blockquote> : null}

            {c.code ? (
              <div className="space-y-4">
                <div className="border border-dashed border-ink px-4 py-4">
                  <p className="text-micro uppercase text-copy">Kupono kodas</p>
                  <p className="wrap-anywhere select-all font-display text-figure font-bold text-rust-ink sm:text-total">{formatCode(c.code)}</p>
                  {c.expiresAt ? <p className="mt-1 text-sm text-copy">{expired ? "Galiojo iki" : "Galioja iki"} {formatExpiry(c.expiresAt)}</p> : null}
                </div>
                {c.status === "aktyvus" && !expired ? <CouponCodeActions code={formatCode(c.code)} sessionId={c.sessionId} /> : null}
              </div>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
