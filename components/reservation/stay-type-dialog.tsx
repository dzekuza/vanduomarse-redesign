"use client";

import { InfoIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { Cta } from "@/components/cta";
import { SERVICE_GALLERY } from "@/components/landing/content";
import { DialogPhotoClose } from "@/components/reservation/dialog-photo-close";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CAMPER_MAX_GUESTS, MAX_STAY_NIGHTS, type StayUnitType } from "@/lib/cabin";

interface StayTypeDialogProps {
  type: StayUnitType;
  title: string;
  price: number;
  className?: string;
}

/** Details of one stay type (cabin size or camper pitch), opened from the info icon in the corner of its card. */
export function StayTypeDialog({ type, title, price, className }: StayTypeDialogProps) {
  const camper = type === "kemperis";
  const photo = camper ? undefined : SERVICE_GALLERY.cabins[0];
  const guests = camper ? CAMPER_MAX_GUESTS : type;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" aria-label={`Daugiau informacijos: ${title}`} className={`flex size-11 items-center justify-center transition-opacity duration-150 hover:opacity-70 ${className ?? ""}`}>
          <InfoIcon size={22} aria-hidden />
        </button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="flex max-h-9/10 flex-col gap-0 overflow-hidden rounded-none border-line bg-popover p-0 text-ink sm:max-w-xl">
        {photo ? (
          <div className="relative h-44 shrink-0 bg-dust-soft md:h-60">
            <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 640px) 576px, 100vw" className="object-cover" />
            <DialogPhotoClose />
          </div>
        ) : null}
        <div className="min-h-0 space-y-6 overflow-y-auto p-6">
          <header className="space-y-3">
            <p className="text-micro uppercase text-copy">Nakvynė Marse</p>
            <DialogTitle className="font-display text-heading! font-bold uppercase">{title}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-copy">
              {camper ? "Viena vieta vienai transporto priemonei, su elektra." : `Namelis iki ${type} asmenų Vanduo Marse parke.`}
            </DialogDescription>
          </header>
          <dl className="grid grid-cols-3 gap-3 border-y border-line py-5">
            <div className="space-y-2">
              <dt className="text-micro uppercase text-copy">Svečių</dt>
              <dd className="text-sm font-bold">Iki {guests}</dd>
            </div>
            <div className="space-y-2">
              <dt className="text-micro uppercase text-copy">Kaina</dt>
              <dd className="text-sm font-bold">{price} € / naktį</dd>
            </div>
            <div className="space-y-2">
              <dt className="text-micro uppercase text-copy">Naktų</dt>
              <dd className="text-sm font-bold">Iki {MAX_STAY_NIGHTS}</dd>
            </div>
          </dl>
          <section className="space-y-3">
            <h3 className="text-item font-bold">Prieš rezervuojant</h3>
            <p className="text-xs leading-relaxed text-copy">Kaina už vienetą, su PVM. Laisvų vienetų skaičių matysi pasirinkęs atvykimo ir išvykimo datas.</p>
          </section>
          <DialogClose asChild>
            <Cta tone="dark" small className="w-full">Grįžti prie tipų</Cta>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
