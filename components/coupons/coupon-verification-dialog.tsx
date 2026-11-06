"use client";

import { ArrowButton } from "@/components/booking/arrow-button";
import { PhoneGate } from "@/components/booking/phone-gate";
import { DialogPhotoClose } from "@/components/reservation/dialog-photo-close";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

interface CouponVerificationDialogProps {
  open: boolean;
  phone: string;
  busy: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: () => void;
}

/** The complete order stays on the page; phone proof is requested only at checkout. */
export function CouponVerificationDialog({ open, phone, busy, error, onClose, onSubmit }: CouponVerificationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !busy) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="max-h-9/10 overflow-y-auto rounded-none border-line bg-popover p-6 text-ink sm:max-w-xl"
        onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }}
        onInteractOutside={(event) => { if (busy) event.preventDefault(); }}
      >
        <DialogPhotoClose disabled={busy} />
        <DialogTitle className="sr-only">Patvirtink kupono užsakymą</DialogTitle>
        <DialogDescription className="sr-only">Užpildytas užsakymas išsaugomas patvirtinus telefono numerį ir paspaudus „Užsakyti kuponą“.</DialogDescription>
        <div className="space-y-4 pt-12">
          {error ? <p role="alert" className="text-sm text-rust-ink">{error}</p> : null}
          <PhoneGate initialPhone={phone} description="Patvirtink telefono numerį, kad galėtume pateikti kupono užsakymą. Atsiųsime 6 skaitmenų kodą SMS žinute.">
            <div className="space-y-5">
              <h2 className="text-heading font-bold">Telefonas patvirtintas</h2>
              <p className="text-sm leading-relaxed text-copy">Užbaik kupono užsakymą. Apmokėjimo detales atsiųsime el. paštu.</p>
              <ArrowButton onClick={onSubmit} disabled={busy}>{busy ? "Siunčiama..." : "Užsakyti kuponą"}</ArrowButton>
            </div>
          </PhoneGate>
        </div>
      </DialogContent>
    </Dialog>
  );
}
