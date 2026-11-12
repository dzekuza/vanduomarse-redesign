import { BOOKING_STATUS, INQUIRY_STATUS, PAYMENT_STATUS } from "@/lib/admin/labels";
import { COUPON_STATUS_LABEL, type CouponStatus } from "@/lib/coupons";
import type { BookingStatus, InquiryStatus, PaymentInfo, PaymentStatus } from "@/lib/admin/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** pending = waiting (yellow), confirmed = approved (green), new = contacted / offered (tan), done = finished (grey), closed = declined or failed (red). */
export type Tone = "pending" | "confirmed" | "new" | "done" | "closed";

const DOT: Record<Tone, string> = {
  pending: "bg-status-warn",
  confirmed: "bg-status-ok",
  new: "bg-status-new",
  done: "bg-status-done",
  closed: "bg-status-bad",
};

/** The pill's tinted background and border; the label colour is never tinted. */
const PILL: Record<Tone, string> = {
  pending: "border-status-warn/60 bg-status-warn/20",
  confirmed: "border-status-ok/60 bg-status-ok/15",
  new: "border-status-new/70 bg-status-new/25",
  done: "border-status-done/50 bg-status-done/15",
  closed: "border-status-bad/60 bg-status-bad/15",
};

const BOOKING_TONE: Record<BookingStatus, Tone> = {
  laukia: "pending",
  patvirtinta: "confirmed",
  ivykdyta: "done",
  atsaukta: "closed",
};

const INQUIRY_TONE: Record<InquiryStatus, Tone> = {
  nauja: "pending",
  susisiekta: "new",
  pasiulymas: "new",
};

const COUPON_TONE: Record<CouponStatus, Tone> = {
  laukia_apmokejimo: "pending",
  aktyvus: "confirmed",
  panaudotas: "done",
  atsauktas: "closed",
};

const PAYMENT_TONE: Record<PaymentStatus, Tone> = {
  laukia: "pending",
  apmoketa: "confirmed",
  pasibaige: "closed",
  nepavyko: "closed",
  grazinta: "done",
};

interface StatusPillProps {
  tone: Tone;
  label: string;
  /** Pending work pulses so it stands out in a long list. */
  pulse?: boolean;
}

/** Pill with a tinted background and a status dot; the label keeps full text contrast. */
export function StatusPill({ tone, label, pulse }: StatusPillProps) {
  return (
    <Badge variant="outline" className={cn("gap-1.5", PILL[tone])}>
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", DOT[tone], pulse && "animate-pulse motion-reduce:animate-none")} />
      {label}
    </Badge>
  );
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <StatusPill tone={BOOKING_TONE[status]} label={BOOKING_STATUS[status]} pulse={status === "laukia"} />;
}

export function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
  return <StatusPill tone={INQUIRY_TONE[status]} label={INQUIRY_STATUS[status]} pulse={status === "nauja"} />;
}

export function CouponStatusBadge({ status }: { status: CouponStatus }) {
  return <StatusPill tone={COUPON_TONE[status]} label={COUPON_STATUS_LABEL[status]} pulse={status === "laukia_apmokejimo"} />;
}

/** The Stripe payment of a web reservation; nothing for requests that were never paid online. */
export function PaymentBadge({ payment }: { payment?: PaymentInfo }) {
  if (!payment) return null;
  return (
    <>
      <StatusPill tone={PAYMENT_TONE[payment.status]} label={PAYMENT_STATUS[payment.status]} />
      {payment.needsReview ? <StatusPill tone="pending" label="Peržiūrėti mokėjimą" pulse /> : null}
    </>
  );
}

/** The folded money state of a sale (`SaleState`): waiting, in force, or cancelled. */
export function SaleStatusBadge({ state, label }: { state: "galioja" | "laukia" | "atsaukta"; label: string }) {
  return <StatusPill tone={state === "laukia" ? "pending" : state === "atsaukta" ? "closed" : "confirmed"} label={label} />;
}
