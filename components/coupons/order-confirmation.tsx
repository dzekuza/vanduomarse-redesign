import type { CouponOrderResult } from "@/app/actions/coupons";
import { formatEuro } from "@/lib/coupons";

interface OrderConfirmationProps {
  order: CouponOrderResult;
  email: string;
  onReset: () => void;
}

/** Shown after an order is stored. Payment is arranged by the team, so it says exactly that. */
export function OrderConfirmation({ order, email, onReset }: OrderConfirmationProps) {
  return (
    <div role="status" className="space-y-5 rounded-tile bg-card p-6 md:p-8">
      <p className="text-xs uppercase text-ink/70">Užsakymas gautas</p>
      <p className="font-wordmark text-6xl text-rust">{order.reference}</p>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-ink/60">Kuponas</dt>
          <dd className="mt-1 font-medium">{order.productName}</dd>
        </div>
        <div>
          <dt className="text-ink/60">Suma</dt>
          <dd className="mt-1 font-medium">{formatEuro(order.amount)}</dd>
        </div>
      </dl>
      <p className="text-sm text-ink/80">
        Susisieksime el. paštu <span className="font-medium">{email}</span> ir pasakysime, kaip apmokėti. Patvirtinę apmokėjimą atsiųsime
        kupono kodą. Užsakymo numerį išsaugokite.
      </p>
      <button type="button" onClick={onReset} className="min-h-11 text-sm font-medium text-ink/70 underline underline-offset-4 hover:text-rust">
        Užsakyti dar vieną kuponą
      </button>
    </div>
  );
}
