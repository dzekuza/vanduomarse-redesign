"use client";

import Image from "next/image";
import { ArrowButton } from "@/components/booking/arrow-button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ACTIVITY_TITLE, type ActivityId } from "@/lib/reservation";
import { ACTIVITY_ICON } from "./activity-icons";
import { DialogPhotoClose } from "./dialog-photo-close";

export interface ExtraOffer {
  id: ActivityId;
  text: string;
}

interface ExtrasOfferDialogProps {
  open: boolean;
  offers: ExtraOffer[];
  /** Park photo shown behind the title. */
  photo: { src: string; alt: string };
  /** Go and look at one of the offered activities. */
  onPick: (id: ActivityId) => void;
  /** Carry on to the contact step without them. */
  onContinue: () => void;
}

/** Shown when Toliau is pressed and other activities are still free that day: a photo header, one row per free activity, and the way on. */
export function ExtrasOfferDialog({ open, offers, photo, onPick, onContinue }: ExtrasOfferDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onContinue()}>
      <DialogContent showCloseButton={false} className="gap-0 overflow-hidden rounded-none p-0 sm:max-w-lg">
        <div className="relative h-48 bg-ink sm:h-56">
          <Image src={photo.src} alt="" fill sizes="32rem" className="object-cover" />
          {/* Neutral ink scrim so the title reads on any photo. */}
          <div aria-hidden className="absolute inset-0 bg-linear-to-t from-ink via-ink/55 to-ink/10" />
          <DialogPhotoClose />
          <div className="absolute inset-x-0 bottom-0 space-y-2 p-6">
            <DialogTitle className="font-display text-heading! leading-tight font-bold text-dust">Tą dieną turime ir daugiau</DialogTitle>
            <DialogDescription className="text-sm text-dust/80">Gal nori papildyti planą, kol dar yra vietų?</DialogDescription>
          </div>
        </div>
        <ul className="divide-y divide-line px-6">
          {offers.map((o) => {
            const Icon = ACTIVITY_ICON[o.id];
            return (
              <li key={o.id} className="flex items-center gap-4 py-5">
                <span className="shrink-0 text-rust">
                  <Icon size={24} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-item font-bold">{ACTIVITY_TITLE[o.id]}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-copy">{o.text}</span>
                </span>
                <button type="button" onClick={() => onPick(o.id)} className="inline-flex min-h-11 shrink-0 items-center border-b border-current text-xs font-bold transition-colors duration-150 ease-out-strong hover:text-rust">
                  Peržiūrėti
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex justify-end border-t border-line p-6">
          <ArrowButton onClick={onContinue}>Ne, tęsti</ArrowButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
