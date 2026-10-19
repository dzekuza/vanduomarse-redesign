import { BOOKING_STATUS, INQUIRY_STATUS } from "@/lib/admin/labels";
import type { BookingStatus, InquiryStatus } from "@/lib/admin/types";
import { Badge } from "@/components/ui/badge";

const BOOKING_TONE: Record<BookingStatus, string> = {
  laukia: "bg-rust text-foam",
  patvirtinta: "bg-ink text-foam",
  ivykdyta: "bg-muted text-muted-foreground",
  atsaukta: "border-border bg-transparent text-muted-foreground line-through",
};

const INQUIRY_TONE: Record<InquiryStatus, string> = {
  nauja: "bg-rust text-foam",
  susisiekta: "bg-lake text-ink",
  pasiulymas: "bg-ink text-foam",
  laimeta: "bg-lake-soft text-foam",
  prarasta: "border-border bg-transparent text-muted-foreground",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge className={BOOKING_TONE[status]}>{BOOKING_STATUS[status]}</Badge>;
}

export function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
  return <Badge className={INQUIRY_TONE[status]}>{INQUIRY_STATUS[status]}</Badge>;
}
