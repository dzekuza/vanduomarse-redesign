import { formatDateTime } from "@/lib/admin/format";
import type { PaymentInfo } from "@/lib/admin/types";
import { TableCell } from "@/components/ui/table";

/** When the request was made and, if paid online, when the payment went through. */
export function BookedOnCell({ createdAt, payment }: { createdAt: string; payment?: PaymentInfo }) {
  return (
    <TableCell className="hidden md:table-cell">
      <p className="text-sm">{formatDateTime(createdAt)}</p>
      {payment?.paidAt ? <p className="text-xs text-muted-foreground">Apmokėta {formatDateTime(payment.paidAt)}</p> : null}
    </TableCell>
  );
}
