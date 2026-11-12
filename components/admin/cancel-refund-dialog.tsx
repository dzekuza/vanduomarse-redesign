"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatEuro } from "@/lib/coupons";

interface CancelRefundDialogProps {
  open: boolean;
  reference: string;
  /** Euros a refund would return (`refundableAmount`). */
  refundable: number;
  busy: boolean;
  onChoose: (refund: boolean) => void;
  onClose: () => void;
}

/** Asked when staff cancel a request that was paid online: refund its share through Stripe, or cancel and leave the money. */
export function CancelRefundDialog({ open, reference, refundable, busy, onChoose, onClose }: CancelRefundDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !busy) onClose(); }}>
      <DialogContent className="sm:max-w-md" onClick={(event) => event.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Atšaukti {reference}?</DialogTitle>
          <DialogDescription>
            Užklausa apmokėta internetu. Galite atšaukti ir iškart grąžinti {formatEuro(refundable)} klientui į kortelę per Stripe
            (pinigai pasirodo per kelias darbo dienas). Grąžinama tik šios užklausos suma, o kitos to paties mokėjimo užklausos nesikeičia.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className="min-h-11" disabled={busy} onClick={() => onChoose(true)}>
            {busy ? "Grąžinama..." : `Atšaukti ir grąžinti ${formatEuro(refundable)}`}
          </Button>
          <Button variant="outline" className="min-h-11" disabled={busy} onClick={() => onChoose(false)}>
            Atšaukti be grąžinimo
          </Button>
          <Button variant="ghost" className="min-h-11" disabled={busy} onClick={onClose}>
            Palikti kaip yra
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
