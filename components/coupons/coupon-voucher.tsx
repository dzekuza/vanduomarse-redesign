import Image from "next/image";
import { Eyebrow } from "@/components/eyebrow";
import { COUPON_RULES, COUPON_RULES_TITLE } from "@/lib/coupon-rules";
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

/**
 * The printable gift coupon, laid out like the Figma design and the PDF attachment (`lib/email/coupon-pdf.ts`): white
 * sheet in a thin aubergine frame, outlined logo and title on top with the star, the gift details, the coral code between
 * dashed lines, the rules, and the "Iki susitikimo Marse." banner along the bottom. Saved as PDF from the print dialog.
 */
export function CouponVoucher({ voucher }: { voucher: CouponVoucherData }) {
  return (
    <article aria-label="Dovanų kuponas" className="mx-auto w-full max-w-3xl overflow-hidden border border-ink bg-white text-ink">
      <header className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-10 sm:pt-8">
        <Image src="/brand/voucher/logo.png" alt="Vanduo Marse" width={190} height={84} priority className="h-auto w-32 sm:w-44" />
        <p className="pt-3 font-display text-heading font-bold normal-case sm:text-total">Dovanų kuponas</p>
      </header>

      <div className="space-y-8 px-6 pt-2 pb-10 sm:px-10">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2 pt-6">
            <Eyebrow className="text-copy">{voucher.recipientName ? `Dovana: ${voucher.recipientName}` : "Dovana"}</Eyebrow>
            <p className="font-display text-heading font-bold uppercase">{voucher.productName}</p>
            <p className="font-display text-total font-bold">{formatEuro(voucher.faceValue)}</p>
            {voucher.buyerName ? <p className="text-sm text-copy">Dovanoja: {voucher.buyerName}</p> : null}
          </div>
          <Image src="/brand/voucher/star.png" alt="" width={140} height={136} className="h-auto w-20 shrink-0 sm:w-28" />
        </div>

        {voucher.message ? <blockquote className="border-l-4 border-rust py-1 pl-4 text-item">{voucher.message}</blockquote> : null}

        <div className="border-y border-dashed border-ink py-6">
          <Eyebrow className="text-copy">Kupono kodas</Eyebrow>
          <p className="wrap-anywhere font-display text-heading font-bold text-rust-ink sm:text-total">{formatCode(voucher.code)}</p>
        </div>

        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-micro uppercase text-copy">Galioja iki</dt>
            <dd className="text-sm font-bold">{formatExpiry(voucher.expiresAt)}</dd>
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
          <Eyebrow className="text-copy">{COUPON_RULES_TITLE}</Eyebrow>
          <ol className="space-y-2 text-sm">
            {COUPON_RULES.map((rule, i) => (
              <li key={rule} className="flex gap-3">
                <span className="font-display font-bold text-rust-ink">{i + 1}</span>
                <span>{rule}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <Image src="/brand/voucher/banner.jpg" alt="Iki susitikimo Marse. vanduomarse.lt" width={2808} height={758} sizes="(min-width: 768px) 768px, 100vw" className="h-auto w-full" />
    </article>
  );
}
