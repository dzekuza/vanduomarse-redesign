import "server-only";
import { pushPaidOrder, type PaidOrderKind } from "@/lib/push/paid-order-push";
import { sendStaffSms } from "@/lib/sms/staff-recipients";

/**
 * The phone side of "a coupon, bracelet plan or WAKE pass was paid": an SMS to every number in /admin/pranesimai that follows
 * payments (subscribed to `mokejimai` or `visi`, so a person added later is included without any change here) plus the mobile app
 * push. The e-mail and the admin bell entry are sent by the same handlers. Only a reference and an amount go out: no name, phone
 * or e-mail. Never throws; a channel that fails does not stop the others or the webhook.
 */

export interface PaidOrderAlert {
  kind: PaidOrderKind;
  reference: string;
  amount: number;
  /** The paid amount did not match the price: staff must look. */
  review: boolean;
  gift?: boolean;
}

const eur = (amount: number) => (Number.isInteger(amount) ? String(amount) : amount.toFixed(2));

/** Where staff handle each kind, as in the other staff texts ("Zr. /admin..."). */
const ADMIN_PAGE: Record<PaidOrderKind, string> = { abonementas: "/admin/apyrankes", planas: "/admin/apyrankes", kuponas: "/admin/kuponai" };

/** ASCII only, like every SMS here: one Lithuanian letter would halve the length of a message segment. */
export function paidOrderSmsText(o: PaidOrderAlert): string {
  const head = o.review ? `PATIKRINTI ${o.kind.toUpperCase()} MOKEJIMA ${o.reference}: ${eur(o.amount)} EUR` : `Apmoketas ${o.kind} ${o.reference}: ${eur(o.amount)} EUR${o.gift ? " (dovana)" : ""}`;
  return `${head}. Zr. ${ADMIN_PAGE[o.kind]}`;
}

export async function alertStaffPaidOrder(o: PaidOrderAlert): Promise<void> {
  await Promise.allSettled([sendStaffSms(["mokejimai"], paidOrderSmsText(o)), pushPaidOrder(o)]);
}
