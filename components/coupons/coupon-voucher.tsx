import Image from "next/image";
import { Eyebrow } from "@/components/eyebrow";
import { MAIN_CONTACT } from "@/lib/contacts";
import { COUPON_SERVICE_LABEL, formatCode, formatEuro, formatExpiry, type CouponService } from "@/lib/coupons";

export interface CouponVoucherData {
  code: string;
  reference: string;
  productName: string;
  faceValue: number;
  service: CouponService;
  /** yyyy-mm-dd */
  expiresAt: string;
  buyerName: string;
  recipientName: string;
  message: string;
}

const STEPS = [
  "Rezervuodami pirtį ar nakvynę svetainėje, laukelyje „Turite dovanų kuponą?“ įveskite kodą.",
  "Arba parodykite šį kuponą (atspausdintą ar telefone) komandai parke.",
  "Kupono vertė sumažina sąskaitą; likutis lieka kuponui iki galiojimo pabaigos.",
];

/**
 * The printable gift coupon: an A4-friendly sheet in the brand style (aubergine band, coral code, blush paper, dashed
 * tear lines). Shown at /kuponai/kuponas and saved as PDF from the browser's print dialog.
 */
export function CouponVoucher({ voucher }: { voucher: CouponVoucherData }) {
  const to = voucher.recipientName || null;
  return (
    <article className="mx-auto w-full max-w-3xl overflow-hidden border border-ink bg-foam text-ink">
      <header className="flex items-center justify-between gap-4 bg-ink px-8 py-6 text-foam">
        <Image src="/brand/logo-light.svg" alt="Vanduo Marse" width={121} height={46} priority />
        <p className="text-micro uppercase text-rust">Dovanų kuponas</p>
      </header>

      <div className="space-y-8 px-8 py-10">
        <div className="space-y-2">
          <Eyebrow className="text-copy">{to ? `Dovana: ${to}` : "Dovana"}</Eyebrow>
          <h1 className="font-display text-heading font-bold uppercase">{voucher.productName}</h1>
          <p className="font-display text-total font-bold">{formatEuro(voucher.faceValue)}</p>
          {voucher.buyerName ? <p className="text-sm text-copy">Dovanoja: {voucher.buyerName}</p> : null}
        </div>

        {voucher.message ? <blockquote className="border-l-4 border-rust py-1 pl-4 text-item italic">{voucher.message}</blockquote> : null}

        <div className="border-y border-dashed border-ink py-6">
          <Eyebrow className="text-copy">Kupono kodas</Eyebrow>
          <p className="wrap-anywhere font-display text-heading font-bold text-rust-ink sm:text-total">{formatCode(voucher.code)}</p>
        </div>

        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-micro uppercase text-copy">Galioja iki</dt>
            <dd className="font-bold">{formatExpiry(voucher.expiresAt)}</dd>
          </div>
          <div>
            <dt className="text-micro uppercase text-copy">Tinka</dt>
            <dd className="font-bold">{COUPON_SERVICE_LABEL[voucher.service]}</dd>
          </div>
          <div>
            <dt className="text-micro uppercase text-copy">Užsakymo nr.</dt>
            <dd className="font-bold">{voucher.reference}</dd>
          </div>
        </dl>

        <section className="space-y-3">
          <Eyebrow className="text-copy">Kaip panaudoti</Eyebrow>
          <ol className="space-y-2 text-sm">
            {STEPS.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="font-display font-bold text-rust-ink">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 bg-ink px-8 py-4 text-sm text-foam">
        <span className="font-bold">vanduomarse.lt</span>
        <span>
          {MAIN_CONTACT.email} · {MAIN_CONTACT.phone}
        </span>
      </footer>
    </article>
  );
}
