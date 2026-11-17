import { toast } from "sonner";
import { z } from "zod";

/** The payment fields every staff "new reservation" form shares (ADR-0112): how it was paid, and whether it was. */
export const paymentFormShape = {
  payMethod: z.enum(["grynais", "kortele"]),
  paid: z.enum(["sumoketa", "nesumoketa"]),
};

export const paymentFormDefaults = { payMethod: "grynais", paid: "sumoketa" } as const;

/** What the server actions take as `payment`. */
export const paymentInput = (v: { payMethod: "grynais" | "kortele"; paid: "sumoketa" | "nesumoketa" }) => ({ method: v.payMethod, paid: v.paid === "sumoketa" });

/** The message of the e-mail-required rule, shared by every form. */
export const PAYMENT_EMAIL_REQUIRED = "Apmokėjimo nuorodai reikia el. pašto.";

/** Copies a payment link; the toast says whether it worked. */
export async function copyPaymentLink(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Nuoroda nukopijuota");
  } catch {
    toast.error("Nepavyko nukopijuoti nuorodos.");
  }
}

/** The toast after saving; an unpaid one says whether the payment link went out, and offers the link when the e-mail did not. */
export function reportCreated(label: string, outcome: { emailSent?: boolean; paymentUrl?: string }) {
  if (outcome.emailSent === undefined) return void toast.success(`${label} sukurta`);
  if (outcome.emailSent) return void toast.success(`${label} sukurta, apmokėjimo nuoroda išsiųsta`);
  const url = outcome.paymentUrl;
  toast.warning(`${label} sukurta, bet laiško išsiųsti nepavyko`, {
    duration: Number.POSITIVE_INFINITY,
    closeButton: true,
    action: url ? { label: "Kopijuoti nuorodą", onClick: () => void copyPaymentLink(url) } : undefined,
  });
}

/** Payment errors that belong to no field (payments off, Stripe refused, an unreachable database) are shown as a toast. */
export function isPaymentFailure(error: { code?: string; message: string }): boolean {
  if (error.code !== "setup" && error.code !== "payment" && error.code !== "settled") return false;
  toast.error(error.message);
  return true;
}
