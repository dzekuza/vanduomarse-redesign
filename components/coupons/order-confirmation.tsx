import type { CouponOrderResult } from "@/app/actions/coupons";
import { Eyebrow } from "@/components/eyebrow";
import { Panel } from "@/components/panel";
import { formatEuro } from "@/lib/coupons";

interface OrderConfirmationProps {
  order: CouponOrderResult;
  email: string;
  onReset: () => void;
}

/** Shown after an order is stored. Payment is arranged by the team, so it says exactly that. */
export function OrderConfirmation({ order, email, onReset }: OrderConfirmationProps) {
  return (
    <Panel role="status" className="space-y-5 sm:p-8">
      <Eyebrow>Užsakymas gautas</Eyebrow>
      <p className="font-display text-total font-bold text-rust">{order.reference}</p>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Kuponas</dt>
          <dd className="mt-1 font-normal">{order.productName}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Suma</dt>
          <dd className="mt-1 font-normal">{formatEuro(order.amount)}</dd>
        </div>
      </dl>
      <p className="text-sm text-muted-foreground">
        Susisieksime el. paštu <span className="font-normal">{email}</span> ir pasakysime, kaip apmokėti. Patvirtinę apmokėjimą atsiųsime
        kupono kodą. Užsakymo numerį išsaugokite.
      </p>
      <button type="button" onClick={onReset} className="min-h-11 text-sm font-normal text-muted-foreground underline underline-offset-4 hover:text-rust">
        Užsakyti dar vieną kuponą
      </button>
    </Panel>
  );
}
