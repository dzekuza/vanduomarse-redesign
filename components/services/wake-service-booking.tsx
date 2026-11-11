"use client";

import { WavesIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Cta } from "@/components/cta";
import { FilterChip } from "@/components/events/filter-chip";
import { PhoneHelp } from "@/components/phone-help";
import { OptionCard } from "@/components/reservation/option-card";
import type { Contact } from "@/lib/contacts";
import { formatEuro, isWakeSeasonPass, type CouponProduct } from "@/lib/coupons";

const TYPES = [
  { id: "ride", label: "Plaukimas" },
  { id: "season", label: "WAKE abonementas" },
] as const;

type WakeType = (typeof TYPES)[number]["id"];

export function WakeServiceBooking({ products, contact }: { products: CouponProduct[]; contact: Contact }) {
  const [type, setType] = useState<WakeType>("ride");
  const [selected, setSelected] = useState<Partial<Record<WakeType, string>>>({});
  const season = type === "season";
  const options = products.filter((product) => isWakeSeasonPass(product) === season);
  const product = options.find(({ id }) => id === selected[type]) ?? options[0];

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-3 flex items-center gap-2 text-sm font-bold">
          <WavesIcon size={18} aria-hidden /> Tipas
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map(({ id, label }) => (
            <FilterChip key={id} active={id === type} onClick={() => setType(id)}
              className="min-w-0 justify-center px-2 py-2 text-center font-bold">
              {label}
            </FilterChip>
          ))}
        </div>
      </fieldset>
      {product ? (
        <>
          <div role="group" aria-label={season ? "Abonementai" : "Plaukimai"} className="grid gap-2">
            {options.map((option) => (
              <OptionCard key={option.id} title={option.name} text={option.description} meta={formatEuro(option.value)}
                selected={option.id === product.id} onClick={() => setSelected((current) => ({ ...current, [type]: option.id }))} />
            ))}
          </div>
          <div className="space-y-3 border-t border-line pt-4">
            <div>
              <p className="text-micro uppercase text-copy">Iš viso, su PVM</p>
              <p aria-live="polite" className="text-total font-bold">{formatEuro(product.value)}</p>
            </div>
            <Cta tone="dark" small className="w-full" href={`/kuponai?produktas=${encodeURIComponent(product.id)}#uzsakymas`}>
              {season ? "Užsakyti abonementą" : "Užsakyti plaukimą"}
            </Cta>
            <p className="text-xs leading-relaxed text-copy">
              {season ? "Apmokėjus gausi kupono kodą. Abonementą su šiuo kodu aktyvuos komanda parke."
                : "Apmokėjus gausi plaukimo kupono kodą. Plaukimo laiką suderink su Marso Akademija."}
            </p>
          </div>
        </>
      ) : (
        <p className="text-sm text-copy">{season ? "Dėl WAKE abonemento susisiek su Marso Akademija."
          : "Dėl plaukimo susisiek su Marso Akademija."}</p>
      )}
      <div>
        <PhoneHelp label={contact.name} phone={contact.phone} />
        <a href={`mailto:${contact.email}`} className="inline-flex min-h-11 items-center text-xs underline underline-offset-4 hover:text-rust">
          {contact.email}
        </a>
      </div>
    </div>
  );
}
