"use client";

import { XIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useRef, useState } from "react";
import type { ServicePhoto } from "@/components/landing/content";
import { ServiceGallery } from "@/components/landing/service-gallery";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const VISIBLE_PHOTOS = 6;

export function ServicePhotoMosaic({ photos, label }: { photos: ServicePhoto[]; label: string }) {
  const [openedAt, setOpenedAt] = useState<number | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const tiles = photos.slice(0, VISIBLE_PHOTOS);

  return (
    <Dialog open={openedAt !== null} onOpenChange={(open) => { if (!open) setOpenedAt(null); }}>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {tiles.map(({ src, alt }, index) => {
          const showAll = index === VISIBLE_PHOTOS - 1 && photos.length > VISIBLE_PHOTOS;
          const wide = tiles.length <= 2 || (tiles.length !== 4 && (index === 2 || index === 3 || (tiles.length === 5 && index === 4)));
          return (
            <button
              key={src}
              type="button"
              aria-haspopup="dialog"
              aria-label={showAll ? `Žiūrėti visas nuotraukas (${photos.length})` : `Atidaryti nuotrauką. ${alt}`}
              onClick={(event) => {
                trigger.current = event.currentTarget;
                setOpenedAt(showAll ? 0 : index);
              }}
              className={cn("group relative h-32 min-w-0 overflow-hidden bg-dust-soft sm:h-44 lg:h-52", wide && "lg:col-span-2", tiles.length === 1 && "col-span-full lg:col-span-full")}
            >
              <Image src={src} alt={alt} fill sizes={wide ? "(min-width: 1024px) 34vw, 50vw" : "(min-width: 1024px) 17vw, 50vw"} className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-105" />
              {showAll ? (
                <span className="absolute inset-0 grid place-items-center bg-ink/65 p-3 text-center text-xs font-bold text-dust sm:text-sm">
                  Žiūrėti visas nuotraukas ({photos.length})
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <DialogContent
        aria-describedby={undefined}
        className="max-h-dvh gap-3 overflow-y-auto rounded-none bg-popover p-3 text-ink sm:max-w-3xl sm:p-5"
        overlayClassName="bg-ink/75"
        showCloseButton={false}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          trigger.current?.focus();
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <DialogTitle>{label}</DialogTitle>
          <DialogClose type="button" aria-label="Uždaryti galeriją" className="grid size-11 shrink-0 place-items-center border border-line hover:border-ink">
            <XIcon size={20} aria-hidden />
          </DialogClose>
        </div>
        {openedAt !== null ? <ServiceGallery photos={photos} variant="lightbox" label={label} initialIndex={openedAt} /> : null}
      </DialogContent>
    </Dialog>
  );
}
