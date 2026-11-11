"use client";

import { InfoIcon } from "@phosphor-icons/react";
import { ServiceGallery } from "@/components/landing/service-gallery";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ACTIVITY_TITLE, type ActivityId, type ReservationData } from "@/lib/reservation";
import { ActivityDetails, activityBlurb } from "./activity-details";
import { DialogPhotoClose } from "./dialog-photo-close";
import { activityPhotos } from "./activity-photos";

/** Each activity's info button opens a dialog with photos and the full activity details. */
export function ActivityAbout({ id, data, active }: { id: ActivityId; data: ReservationData; active: boolean }) {
  const title = ACTIVITY_TITLE[id];
  const photos = activityPhotos(id, data);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Sužinoti daugiau: ${title}`}
          title="Sužinoti daugiau"
          className={`grid size-11 shrink-0 place-items-center self-center transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-current ${
            active ? "text-dust/80 hover:text-dust" : "text-copy hover:text-ink"
          }`}
        >
          <InfoIcon aria-hidden className="size-5" />
        </button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="flex max-h-9/10 flex-col gap-0 overflow-hidden rounded-none p-0 sm:max-w-lg">
        <div className="relative shrink-0">
          <ServiceGallery key={`${id}:${photos.map(({ src }) => src).join("|")}`} photos={photos} />
          <DialogPhotoClose />
        </div>
        <div className="min-h-0 space-y-6 overflow-y-auto p-6">
          <header className="space-y-2">
            <DialogTitle className="font-display text-heading leading-tight font-bold">{title}</DialogTitle>
            <DialogDescription className="text-copy">{activityBlurb(id)}</DialogDescription>
          </header>
          <ActivityDetails id={id} data={data} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
