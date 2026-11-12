import { cn } from "@/lib/utils";

/** waiting (yellow), approved or paid (green), finished or refunded (grey), declined, failed or expired (red). */
export type StatusTone = "pending" | "confirmed" | "done" | "closed";

const DOT: Record<StatusTone, string> = {
  pending: "bg-status-warn",
  confirmed: "bg-status-ok",
  done: "bg-status-done",
  closed: "bg-status-bad",
};

/** Tinted square tag, like the admin status pills but with the public pages' square corners; the label keeps full text contrast. */
const TAG: Record<StatusTone, string> = {
  pending: "border-status-warn/60 bg-status-warn/20",
  confirmed: "border-status-ok/60 bg-status-ok/15",
  done: "border-status-done/50 bg-status-done/15",
  closed: "border-status-bad/60 bg-status-bad/15",
};

export function StatusTag({ tone, label, className }: { tone: StatusTone; label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 border px-2 py-0.5", TAG[tone], className)}>
      <span aria-hidden className={cn("size-2 shrink-0", DOT[tone])} />
      {label}
    </span>
  );
}

/** Reservation request status (`MyRequest["status"]`). */
export const REQUEST_STATUS_TONE: Record<"laukia" | "patvirtinta" | "ivykdyta" | "atsaukta", StatusTone> = {
  laukia: "pending",
  patvirtinta: "confirmed",
  ivykdyta: "done",
  atsaukta: "closed",
};

/** Stripe payment state of a request. */
export const REQUEST_PAYMENT_TONE: Record<"laukia" | "apmoketa" | "pasibaige" | "nepavyko" | "grazinta", StatusTone> = {
  laukia: "pending",
  apmoketa: "confirmed",
  pasibaige: "closed",
  nepavyko: "closed",
  grazinta: "done",
};
