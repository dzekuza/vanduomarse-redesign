import "server-only";
import { sendStaffPush } from "@/lib/push/staff-push";

/** What was paid, in the words staff use. */
export type PaidOrderKind = "abonementas" | "planas" | "kuponas";

const TITLE: Record<PaidOrderKind, string> = {
  abonementas: "Apmokėtas abonementas",
  planas: "Apmokėtas planas",
  kuponas: "Apmokėtas kuponas",
};

const euro = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(2)} €`;

/**
 * The mobile push for a paid coupon, bracelet plan or WAKE pass, next to its admin bell entry and e-mail. Like the booking
 * payment push it carries no name, phone or e-mail: it passes through Expo's service and shows on lock screens. `review` is a
 * payment whose amount did not match, which staff must look at. Never throws (see `sendStaffPush`).
 */
export function pushPaidOrder(o: { kind: PaidOrderKind; reference: string; amount: number; review: boolean; gift?: boolean }): Promise<boolean> {
  return sendStaffPush("mokejimai", {
    title: o.review ? "Patikrinti mokėjimą" : TITLE[o.kind],
    body: `${o.reference} · ${euro(o.amount)}${o.gift ? " · dovana" : ""}`,
    data: { references: o.reference },
  });
}
