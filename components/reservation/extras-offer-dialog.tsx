"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ACTIVITY_TITLE, type ActivityId } from "@/lib/reservation";

export interface ExtraOffer {
  id: ActivityId;
  text: string;
}

interface ExtrasOfferDialogProps {
  open: boolean;
  offers: ExtraOffer[];
  /** Go and look at one of the offered activities. */
  onPick: (id: ActivityId) => void;
  /** Carry on to the contact step without them. */
  onContinue: () => void;
}

/** Shown when Toliau is pressed and other activities are still free that day: "we also have quads, want them before the sauna?" */
export function ExtrasOfferDialog({ open, offers, onPick, onContinue }: ExtrasOfferDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onContinue()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tą dieną turime ir daugiau</DialogTitle>
          <DialogDescription>Gal norite papildyti savo planą, kol dar yra vietų?</DialogDescription>
        </DialogHeader>
        <ul className="space-y-3">
          {offers.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-4 border border-line p-4">
              <span className="min-w-0 text-sm">
                <span className="block font-display text-lg font-bold">{ACTIVITY_TITLE[o.id]}</span>
                <span className="block text-ink/70">{o.text}</span>
              </span>
              <Button type="button" variant="outline" className="shrink-0" onClick={() => onPick(o.id)}>
                Peržiūrėti
              </Button>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button type="button" onClick={onContinue}>
            Ne, tęsti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
