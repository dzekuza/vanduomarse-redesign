"use client";

import Image from "next/image";
import { ArrowButton } from "@/components/booking/arrow-button";
import { Panel } from "@/components/panel";
import {
  CIONGO_DEFAULT_PEOPLE,
  ciongoFromPrice,
  ciongoPackagesByPrice,
  type CiongoPackage,
  type CiongoPriceSources,
} from "@/lib/ciongo-packages";
import { formatMoney } from "@/lib/event-pricing";
import { useCiongoSources } from "./ciongo-package-booking";
import { useCiongoPackage } from "./ciongo-package-state";
import { CiongoPriceLines } from "./ciongo-price-lines";

/**
 * "Paketai" on the quads page: the five CIONGO x Vanduo Marse packages as rows in the style of the Renginiai feed
 * (`EventRow` as it looks on phones, at every width): photo, tag, title and summary, the program (if any), each item's price for 10, then under a hairline the
 * price on the left and "Rinktis" on the right. A package with a suggested day shows its
 * "Orientacinė programa" above the price, always open.
 * Cheapest first.
 */
export function CiongoPackagesSection() {
  const sources = useCiongoSources();
  return (
    <div className="space-y-5">
      <p className="text-sm leading-loose text-copy">
        Keturračių turas su gidu, privati pirtis ir vaišės vienoje vietoje. Kiekviename pakete rinkis suomišką pirtį arba malkinę
        pirtį su pirtininku. Kainos {CIONGO_DEFAULT_PEOPLE} žmonių grupei; žmonių skaičių, datą ir nakvynę pasirinksi rezervacijos formoje.
      </p>
      <div className="space-y-3">
        {ciongoPackagesByPrice(sources).map((pkg) => <PackageRow key={pkg.id} pkg={pkg} sources={sources} />)}
      </div>
    </div>
  );
}

function PackageRow({ pkg, sources }: { pkg: CiongoPackage; sources: CiongoPriceSources }) {
  const { choose } = useCiongoPackage();
  const from = ciongoFromPrice(pkg, sources).min;
  const perPerson = Math.round(from / CIONGO_DEFAULT_PEOPLE);
  const cover = pkg.photos[0];

  return (
    <Panel as="article" aria-labelledby={`paketas-${pkg.id}`} className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-4 bg-foam">
      <div className="relative size-20 shrink-0 self-start overflow-hidden bg-dust-soft sm:size-28">
        {cover ? <Image src={cover.src} alt={cover.alt} fill sizes="112px" className="object-cover" /> : null}
      </div>
      <div className="min-w-0">
        <span className="inline-block border border-line px-2 py-0.5 text-micro uppercase">{pkg.tag}</span>
        <h3 id={`paketas-${pkg.id}`} className="mt-2 text-item font-bold">{pkg.title}</h3>
        <p className="mt-1 max-w-xl text-xs leading-relaxed text-copy">{pkg.summary}</p>
      </div>
      {pkg.program.length > 0 ? (
        <div className="col-span-2 space-y-3 border-t border-line pt-4">
          <p className="text-sm font-bold">Orientacinė programa</p>
          <ol className="space-y-2">
            {pkg.program.map((step) => (
              <li key={step.time} className="flex gap-3 text-xs">
                <span className="w-28 shrink-0 font-bold tabular-nums">{step.time}</span>
                <span className="min-w-0">
                  <span className="block">{step.title}</span>
                  {step.note ? <span className="block text-copy">{step.note}</span> : null}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      <div className="col-span-2 border-t border-line pt-4">
        <CiongoPriceLines pkg={pkg} sources={sources} />
      </div>
      <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <div>
          <p className="flex items-baseline gap-1.5"><span className="text-xs text-copy">nuo</span><span className="font-display text-figure font-bold">{formatMoney({ min: from, max: from })}</span></p>
          <p className="text-xs text-copy">apie {perPerson} € žmogui · {CIONGO_DEFAULT_PEOPLE} žmonių grupei</p>
        </div>
        <ArrowButton onClick={() => choose(pkg.id)}>Rinktis</ArrowButton>
      </div>
    </Panel>
  );
}
