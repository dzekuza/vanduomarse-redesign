"use client";

import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { GALLERY_SLIDES, SERVICE_GALLERY, type ServicePhoto } from "@/components/landing/content";
import { ServiceGallery } from "@/components/landing/service-gallery";
import { DialogPhotoClose } from "@/components/reservation/dialog-photo-close";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatMoney, type Space, type SpaceId } from "@/lib/event-pricing";

const parkPhoto = GALLERY_SLIDES[0];
const [domePhoto, nightPhoto, foodPhoto] = SERVICE_GALLERY.party;
const domePhotos = [domePhoto, parkPhoto];
const restaurantPhotos = [parkPhoto, foodPhoto];
const parkPhotos = [parkPhoto, domePhoto, nightPhoto];

const SPACE_PHOTOS: Record<SpaceId, ServicePhoto[]> = {
  terasa: restaurantPhotos,
  "kupolas-svente": [domePhoto, nightPhoto, parkPhoto],
  "kupolas-seminaras": domePhotos,
  "kupolas-corona": domePhotos,
  corona: [parkPhoto, nightPhoto],
  restoranas: restaurantPhotos,
  parkas: parkPhotos,
  "parkas-wake": [parkPhoto, ...SERVICE_GALLERY.wake, domePhoto],
};

interface SpaceDetailsDialogProps {
  space: Space;
  rentLabel: string | null;
  minimumSpend: number;
}

export function SpaceDetailsDialog({ space, rentLabel, minimumSpend }: SpaceDetailsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Daugiau informacijos: ${space.label}`}
          className="inline-flex min-h-11 items-center gap-2 text-left text-xs font-bold underline underline-offset-4 transition-opacity hover:opacity-70"
        >
          Daugiau informacijos
          <ArrowUpRightIcon aria-hidden className="size-4 shrink-0" />
        </button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="flex max-h-9/10 flex-col gap-0 overflow-hidden rounded-none border-line bg-popover p-0 text-ink sm:max-w-xl">
        <div className="relative shrink-0">
          <ServiceGallery photos={SPACE_PHOTOS[space.id]} label="Parko ir renginių aplinkos nuotraukos" />
          <DialogPhotoClose />
        </div>
        <div className="min-h-0 space-y-5 overflow-y-auto p-5 sm:p-6">
          <header className="space-y-3">
            <p className="text-micro uppercase text-copy">Parko ir renginių aplinka</p>
            <DialogTitle className="font-display text-heading font-bold">{space.label}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-copy">{space.blurb}</DialogDescription>
          </header>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-5 border-y border-line py-4">
            <div>
              <dt className="text-micro uppercase text-copy">Talpa</dt>
              <dd className="mt-1 text-xs font-bold">Iki {space.maxGuests} asm.</dd>
            </div>
            <div>
              <dt className="text-micro uppercase text-copy">Trukmė</dt>
              <dd className="mt-1 text-xs font-bold">{space.includedTime}</dd>
            </div>
            {rentLabel ? (
              <div>
                <dt className="text-micro uppercase text-copy">Nuoma</dt>
                <dd className="mt-1 text-xs font-bold">{rentLabel}</dd>
              </div>
            ) : null}
            {minimumSpend > 0 ? (
              <div>
                <dt className="text-micro uppercase text-copy">Minimali maisto ir gėrimų sąskaita</dt>
                <dd className="mt-1 text-xs font-bold">{formatMoney({ min: minimumSpend, max: minimumSpend })}</dd>
              </div>
            ) : null}
            {space.extraHour ? (
              <div>
                <dt className="text-micro uppercase text-copy">{space.extraHour.label}</dt>
                <dd className="mt-1 text-xs font-bold">{formatMoney({ min: space.extraHour.rate, max: space.extraHour.rate })} / val.</dd>
              </div>
            ) : null}
          </dl>
          {space.note ? <p className="text-xs leading-relaxed text-copy">{space.note}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
