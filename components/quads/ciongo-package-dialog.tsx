"use client";

import { InfoIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { Cta } from "@/components/cta";
import { DialogPhotoClose } from "@/components/reservation/dialog-photo-close";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  CIONGO_DEFAULT_PEOPLE,
  ciongoEstimate,
  type CiongoPackage,
  type CiongoPriceSources,
} from "@/lib/ciongo-packages";
import { formatMoney } from "@/lib/event-pricing";
import { CiongoPriceLines } from "./ciongo-price-lines";

/** A package's details (what is in it with prices for 10, totals, the suggested day) from the booking tile's info icon; "Rinktis šį tipą" picks it. */
export function CiongoPackageDialog({ pkg, sources, onChoose, className }: {
  pkg: CiongoPackage;
  sources: CiongoPriceSources;
  onChoose: () => void;
  className?: string;
}) {
  const estimate = ciongoEstimate(pkg, { people: CIONGO_DEFAULT_PEOPLE, sauna: "suomiska", overnight: false, day: null }, sources);
  const cover = pkg.photos[0];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" aria-label={`Daugiau apie: ${pkg.title}`} className={`flex size-11 items-center justify-center transition-opacity duration-150 hover:opacity-70 ${className ?? ""}`}>
          <InfoIcon size={18} aria-hidden />
        </button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="flex max-h-9/10 flex-col gap-0 overflow-hidden rounded-none border-line bg-popover p-0 text-ink sm:max-w-xl">
        <div className="relative h-44 shrink-0 bg-dust-soft md:h-56">
          {cover ? <Image src={cover.src} alt={cover.alt} fill sizes="(min-width: 640px) 576px, 100vw" className="object-cover" /> : null}
          <DialogPhotoClose />
        </div>
        <div className="min-h-0 space-y-6 overflow-y-auto p-6">
          <header className="space-y-3">
            <p className="text-micro uppercase text-copy">{pkg.tag}</p>
            <DialogTitle className="font-display text-heading! font-bold uppercase">{pkg.title}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-copy">{pkg.summary}</DialogDescription>
          </header>
          <section className="space-y-3">
            <h3 className="text-item font-bold">Kas įeina · {CIONGO_DEFAULT_PEOPLE} žmonių</h3>
            <CiongoPriceLines pkg={pkg} sources={sources} />
            <p className="flex flex-wrap items-baseline gap-x-6 gap-y-1 pt-1">
              <span className="flex items-baseline gap-2"><span className="text-micro uppercase text-copy">Visai grupei</span><span className="text-item font-bold tabular-nums">{formatMoney(estimate.total)}</span></span>
              <span className="flex items-baseline gap-2"><span className="text-micro uppercase text-copy">Vienam žmogui</span><span className="text-sm font-bold tabular-nums">{formatMoney(estimate.perPerson)}</span></span>
            </p>
          </section>
          {pkg.program.length > 0 ? (
            <section className="space-y-2">
              <h3 className="text-item font-bold">Orientacinė programa</h3>
              <ol className="divide-y divide-line">
                {pkg.program.map((step) => (
                  <li key={step.time} className="flex gap-3 py-2 text-xs">
                    <span className="w-28 shrink-0 font-bold tabular-nums">{step.time}</span>
                    <span className="min-w-0">
                      <span className="block">{step.title}</span>
                      {step.note ? <span className="block text-copy">{step.note}</span> : null}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
          <p className="text-xs leading-relaxed text-copy">Kainos su PVM. Žmonių skaičių (5–15), pirtį, nakvynę ir datą pasirinksi rezervacijos formoje; galutinę kainą patvirtins komanda.</p>
          <DialogClose asChild>
            <Cta tone="coral" small className="w-full" onClick={onChoose}>Rinktis šį tipą</Cta>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
