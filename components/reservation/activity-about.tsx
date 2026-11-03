"use client";

import { useState } from "react";
import { SERVICE_GALLERY, type ServicePhoto } from "@/components/landing/content";
import { ServiceGallery } from "@/components/landing/service-gallery";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
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

/** Under the tabs: one line about the chosen activity and a "Sužinoti daugiau" button that opens a dialog with a photo carousel and the full details. */
export function ActivityAbout({ id, data }: { id: ActivityId; data: ReservationData }) {
  const [open, setOpen] = useState(false);
  const title = ACTIVITY_TITLE[id];
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <p className="max-w-xl text-sm text-muted-foreground">{activityBlurb(id, data)}</p>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-11 shrink-0 items-center self-start border-b border-current text-xs font-bold transition-colors duration-150 ease-out-strong hover:text-rust sm:self-auto">
        Sužinoti daugiau
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="flex max-h-9/10 flex-col gap-0 overflow-hidden rounded-none p-0 sm:max-w-lg">
          <div className="relative shrink-0">
            <ServiceGallery key={id} photos={photosFor(id, data)} />
            <DialogPhotoClose />
          </div>
          <div className="min-h-0 space-y-6 overflow-y-auto p-6">
            <header className="space-y-2">
              <DialogTitle className="font-display text-heading leading-tight font-bold">{title}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">{activityBlurb(id, data)}</DialogDescription>
            </header>
            <ActivityDetails id={id} data={data} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
