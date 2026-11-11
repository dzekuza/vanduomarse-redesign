"use client";

import { Cta } from "@/components/cta";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DialogPhotoClose } from "@/components/reservation/dialog-photo-close";
import { PlanSummary } from "@/components/reservation/plan-summary";
import type { PlanLine } from "@/lib/reservation";

export function QuadPreviewReview({ open, onClose, onReturnFocus, lines, total, inquiryHref }: {
  open: boolean;
  onClose: () => void;
  onReturnFocus?: () => void;
  lines: PlanLine[];
  total: number;
  inquiryHref?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="rounded-none border-line bg-dust text-ink sm:max-w-lg"
        onCloseAutoFocus={onReturnFocus ? (event) => {
          event.preventDefault();
          onReturnFocus();
        } : undefined}
      >
        <DialogPhotoClose />
        <DialogTitle className="pr-14 font-display text-heading font-bold">{inquiryHref ? "Keturračių rezervacijos užklausa" : "Tavo planas Marse."}</DialogTitle>
        <DialogDescription className="text-copy">{inquiryHref ? "Patikrink pasirinktą turą. Rezervaciją patvirtins komanda." : "Interaktyvi dizaino peržiūra."}</DialogDescription>
        <PlanSummary lines={lines} total={total} />
        {inquiryHref ? <Cta tone="dark" small href={inquiryHref}>Atidaryti el. laišką</Cta> : <Cta tone="dark" small onClick={onClose}>Tęsti peržiūrą</Cta>}
      </DialogContent>
    </Dialog>
  );
}
