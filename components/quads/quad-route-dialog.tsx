"use client";

import Image from "next/image";
import { Cta } from "@/components/cta";
import { DialogPhotoClose } from "@/components/reservation/dialog-photo-close";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QUAD_PREVIEW_MIN_UNITS, type QuadPreviewRoute } from "./quad-preview-content";

/** Route details reuse the activity dialog, without expanding or changing the booking cards. */
export function QuadRouteDialog({ route }: { route: QuadPreviewRoute }) {
  const title = `${route.name} turas`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" aria-label={`Daugiau apie trasą: ${title}`} className="flex min-h-11 items-center text-left text-xs underline underline-offset-4 transition-opacity duration-150 hover:opacity-70">
          Daugiau apie trasą
        </button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="flex max-h-9/10 flex-col gap-0 overflow-hidden rounded-none border-line bg-popover p-0 text-ink sm:max-w-xl">
        <div className="relative h-44 shrink-0 bg-dust-soft md:h-60">
          <Image src={route.photo} alt={`${title}: trasos akimirka`} fill sizes="(min-width: 640px) 576px, 100vw" className="object-cover" />
          <DialogPhotoClose />
        </div>
        <div className="min-h-0 space-y-6 overflow-y-auto p-6">
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-micro uppercase text-copy">
              <span>Trasa Marse</span>
              {route.badge ? <span className="bg-dust px-2 py-1 font-bold text-ink">{route.badge}</span> : null}
            </div>
            <DialogTitle className="font-display text-heading! font-bold uppercase">{title}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-copy">{route.longDescription}</DialogDescription>
          </header>
          <dl className="grid grid-cols-3 gap-3 border-y border-line py-5">
            <div className="space-y-2">
              <dt className="text-micro uppercase text-copy">Trukmė</dt>
              <dd className="text-sm font-bold">{route.durationLabel}</dd>
            </div>
            <div className="space-y-2">
              <dt className="text-micro uppercase text-copy">Atstumas</dt>
              <dd className="text-sm font-bold">{route.kilometres} km</dd>
            </div>
            <div className="space-y-2">
              <dt className="text-micro uppercase text-copy">Kaina</dt>
              <dd className="text-sm font-bold">{route.price} €</dd>
            </div>
          </dl>
          <section className="space-y-3">
            <h3 className="text-item font-bold">Prieš išvykstant</h3>
            <p className="text-xs leading-relaxed text-copy">Kaina už keturratį, su PVM. Vienam ar dviem kaina ta pati.</p>
            <p className="text-xs leading-relaxed text-copy">Turui reikia bent {QUAD_PREVIEW_MIN_UNITS} keturračių. Maršrutą rodo gidas.</p>
          </section>
          <DialogClose asChild>
            <Cta tone="dark" small className="w-full">Grįžti prie trasų</Cta>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
