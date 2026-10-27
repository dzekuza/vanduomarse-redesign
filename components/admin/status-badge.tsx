import { BOOKING_STATUS, INQUIRY_STATUS } from "@/lib/admin/labels";
import { COUPON_STATUS_LABEL, type CouponStatus } from "@/lib/coupons";
import type { BookingStatus, InquiryStatus } from "@/lib/admin/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "pending" | "confirmed" | "new" | "done" | "closed";

const DOT: Record<Tone, string> = {
  pending: "bg-status-pending",
  confirmed: "bg-status-confirmed",
  new: "bg-status-new",
  done: "bg-status-done",
  closed: "bg-transparent ring-1 ring-status-done",
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
  laimeta: "confirmed",
  prarasta: "closed",
};

const COUPON_TONE: Record<CouponStatus, Tone> = {
  laukia_apmokejimo: "pending",
  aktyvus: "confirmed",
  panaudotas: "done",
  atsauktas: "closed",
};

interface StatusPillProps {
  tone: Tone;
  label: string;
  /** Pending work pulses so it stands out in a long list. */
  pulse?: boolean;
}

/** Neutral pill with a coloured status dot; the label keeps full text contrast. */
function StatusPill({ tone, label, pulse }: StatusPillProps) {
  return (
    <Badge variant="outline" className={cn("gap-1.5 bg-card", tone === "closed" && "text-muted-foreground")}>
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
