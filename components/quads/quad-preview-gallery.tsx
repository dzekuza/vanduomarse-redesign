"use client";

import Image from "next/image";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DialogPhotoClose } from "@/components/reservation/dialog-photo-close";
import { QUAD_PREVIEW_GALLERY } from "./quad-preview-content";

export function QuadPreviewGallery() {
  const [index, setIndex] = useState<number | null>(null);
  const photo = index === null ? null : QUAD_PREVIEW_GALLERY[index];
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-heading font-bold">Purvo bus. Prisiminimų irgi.</h2>
        <p className="text-micro uppercase text-copy">Akimirkos iš trasos</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {QUAD_PREVIEW_GALLERY.map((image, position) => (
          <button key={image.src} type="button" aria-label={`Peržiūrėti nuotrauką ${position + 1}: ${image.alt}`} onClick={() => setIndex(position)} className="group relative aspect-square min-h-11 overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
            <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 18vw, 44vw" className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-105" />
          </button>
        ))}
      </div>
      <Dialog open={photo !== null} onOpenChange={(open) => !open && setIndex(null)}>
        <DialogContent showCloseButton={false} className="rounded-none border-line bg-dust p-4 sm:max-w-5xl">
          <DialogPhotoClose />
          <DialogTitle className="sr-only">{photo?.alt ?? "Keturračių galerija"}</DialogTitle>
          <DialogDescription className="sr-only">Nuotrauka iš keturračių turo.</DialogDescription>
          {photo ? <div className="relative h-96 md:h-128"><Image src={photo.src} alt={photo.alt} fill sizes="90vw" className="object-contain" /></div> : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
