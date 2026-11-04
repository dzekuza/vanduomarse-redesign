"use client";

import { InfoIcon } from "@phosphor-icons/react";
import { SERVICE_GALLERY, type ServicePhoto } from "@/components/landing/content";
import { ServiceGallery } from "@/components/landing/service-gallery";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ACTIVITY_TITLE, type ActivityId, type ReservationData } from "@/lib/reservation";
import { ActivityDetails, activityBlurb } from "./activity-details";
import { DialogPhotoClose } from "./dialog-photo-close";

/** Photos for an activity's dialog: the saunas' own uploads when there are any, otherwise the park's landing gallery. */
function photosFor(id: ActivityId, data: ReservationData): ServicePhoto[] {
  if (id === "pirtis") {
    const own = data.sauna.saunas.flatMap((s) => s.photos.map((p) => ({ src: p.url, alt: s.name })));
    return own.length > 0 ? own : SERVICE_GALLERY.sauna;
  }
  return id === "nakvyne" ? SERVICE_GALLERY.cabins : SERVICE_GALLERY.ciongo;
}

/** Each activity's info button opens a dialog with photos and the full activity details. */
export function ActivityAbout({ id, data, active }: { id: ActivityId; data: ReservationData; active: boolean }) {
  const title = ACTIVITY_TITLE[id];
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
          <ServiceGallery key={id} photos={photosFor(id, data)} />
          <DialogPhotoClose />
        </div>
        <div className="min-h-0 space-y-6 overflow-y-auto p-6">
          <header className="space-y-2">
            <DialogTitle className="font-display text-heading leading-tight font-bold">{title}</DialogTitle>
            <DialogDescription className="text-copy">{activityBlurb(id, data)}</DialogDescription>
          </header>
          <ActivityDetails id={id} data={data} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
