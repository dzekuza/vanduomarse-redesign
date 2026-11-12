import { BookingPrice } from "@/components/booking/booking-price";
import { formatEuro } from "@/lib/coupons";
import type { PlanLine } from "@/lib/reservation";

/** An applied discount code and the euros it takes off the plan. */
export interface SummaryDiscount {
  code: string;
  amount: number;
}

/** Static review reused before registration and after completing a design preview. */
export function PlanSummary({ lines, total, discount, compact = false }: { lines: PlanLine[]; total: number; discount?: SummaryDiscount; compact?: boolean }) {
  const discounted = discount && discount.amount > 0 ? discount : null;
  const totalInLine = lines.length === 1 && !discounted;
  return (
    <div className={compact ? "space-y-3" : "space-y-5"}>
      <ul className="divide-y divide-line border-y border-line">
        {lines.map((line) => (
          <li key={line.id} className={`flex items-start justify-between gap-4 ${compact ? "py-3 text-xs" : "py-4 text-sm"}`}>
            <div className={compact ? "min-w-0 space-y-1" : "min-w-0 space-y-2"}>
              <p className="font-bold">{line.title}</p>
              <p className="text-copy">{line.detail}</p>
              <p className="text-copy">{line.schedule}</p>
            </div>
            <div className="shrink-0 text-right">
              {totalInLine ? <BookingPrice amount={formatEuro(total)} /> : <p className="font-bold">{line.price} €</p>}
            </div>
          </li>
        ))}
      </ul>
      {discounted ? (
        <div className={`flex items-baseline justify-between gap-4 ${compact ? "text-xs" : "text-sm"}`}>
          <span>Nuolaida ({discounted.code})</span>
          <span className="shrink-0 font-bold">−{discounted.amount} €</span>
        </div>
      ) : null}
      {totalInLine ? null : (
        <div className="text-right">
          <BookingPrice amount={formatEuro(total - (discounted?.amount ?? 0))} />
        </div>
      )}
    </div>
  );
}
