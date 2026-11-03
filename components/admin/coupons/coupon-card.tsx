import { CouponStatusBadge } from "../status-badge";
import { formatDateTime } from "@/lib/admin/format";
import type { Coupon } from "@/lib/admin/types";
import { formatCode, formatEuro } from "@/lib/coupons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** One order or issued coupon; the whole card opens the details sheet. */
export function CouponCard({ coupon: c, onOpen }: { coupon: Coupon; onOpen: () => void }) {
  const partlyUsed = c.status === "aktyvus" && c.balance < c.faceValue;
  return (
    <Card className="relative h-full transition-colors focus-within:border-ink hover:border-ink">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <CardTitle className="text-item">
          <button type="button" onClick={onOpen} className="text-left after:absolute after:inset-0 focus-visible:outline-none">
            {c.productName}
          </button>
        </CardTitle>
        <CouponStatusBadge status={c.status} />
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="font-display text-figure font-bold">
          {partlyUsed ? `${formatEuro(c.balance)} iš ${formatEuro(c.faceValue)}` : formatEuro(c.faceValue)}
        </p>
        {c.code ? <p className="font-mono text-sm tracking-wide">{formatCode(c.code)}</p> : null}
        <p className="truncate text-xs text-muted-foreground">
          {c.reference} · {c.buyer.name} · {formatDateTime(c.createdAt)}
        </p>
      </CardContent>
    </Card>
  );
}
