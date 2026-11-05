"use client";

import { Cta } from "@/components/cta";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DialogPhotoClose } from "@/components/reservation/dialog-photo-close";
import { PlanSummary } from "@/components/reservation/plan-summary";
import type { PlanLine } from "@/lib/reservation";

export function QuadPreviewReview({ open, onClose, lines, total }: { open: boolean; onClose: () => void; lines: PlanLine[]; total: number }) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent showCloseButton={false} className="rounded-none border-line bg-dust text-ink sm:max-w-lg">
        <DialogPhotoClose />
        <DialogTitle className="pr-14 font-display text-heading font-bold">Tavo planas Marse.</DialogTitle>
        <DialogDescription className="text-copy">Interaktyvi dizaino peržiūra.</DialogDescription>
        <PlanSummary lines={lines} total={total} />
        <Cta tone="dark" small onClick={onClose}>Tęsti peržiūrą</Cta>
      </DialogContent>
    </Dialog>
  );
}
