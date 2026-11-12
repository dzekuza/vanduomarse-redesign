"use client";

import { WavesIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Cta } from "@/components/cta";
import { BOOKING_CHOICE_CLASS, FilterChip } from "@/components/events/filter-chip";
import { OptionCard } from "@/components/reservation/option-card";
import { PLAN_PRIMARY_CLASS } from "@/components/reservation/plan-actions";
import type { Contact } from "@/lib/contacts";
import { formatEuro, isWakeSeasonPass, type CouponProduct } from "@/lib/coupons";
import { ServiceBookingHelp } from "./service-booking-help";

const TYPES = [
  { id: "ride", label: "Plaukimas" },
  { id: "season", label: "WAKE abonementas" },
] as const;

type WakeType = (typeof TYPES)[number]["id"];

export function useWakeBooking(products?: CouponProduct[]) {
  const [type, setType] = useState<WakeType>("ride");
  const [selected, setSelected] = useState<Partial<Record<WakeType, string>>>({});
  const offers: Record<WakeType, CouponProduct[]> = { ride: [], season: [] };
  for (const product of products ?? []) {
    offers[isWakeSeasonPass(product) ? "season" : "ride"].push(product);
  }
  const options = offers[type];
  const product = options.find(({ id }) => id === selected[type]) ?? options[0];

  return {
    type,
    setType,
    offers,
    options,
    product,
    selectProduct: (id: string) => setSelected((current) => ({ ...current, [type]: id })),
  };
}

export function WakeBookingChoices({ type, setType, offers, options, product, selectProduct }: ReturnType<typeof useWakeBooking>) {
  const season = type === "season";

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-3 flex items-center gap-2 text-sm font-bold">
          <WavesIcon size={18} aria-hidden /> Tipas
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map(({ id, label }) => {
            const prices = offers[id].map(({ value }) => value);
            const active = id === type;
            const lowest = prices.length ? Math.min(...prices) : undefined;
            const from = prices.some((price) => price !== lowest);

            return (
              <FilterChip key={id} active={active} onClick={() => setType(id)} className={BOOKING_CHOICE_CLASS}>
                <span className="font-bold">{label}</span>
                {lowest !== undefined ? (
                  <span className={active ? "text-dust/80" : "text-copy"}>{from ? "nuo " : ""}{formatEuro(lowest)}</span>
                ) : null}
              </FilterChip>
            );
          })}
        </div>
      </fieldset>
      {product ? (
        <div role="group" aria-label={season ? "Abonementai" : "Plaukimai"} className="grid gap-2">
          {options.map((option) => (
            <OptionCard key={option.id} title={option.name} text={option.description} meta={formatEuro(option.value)}
              selected={option.id === product.id} onClick={() => selectProduct(option.id)} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-copy">{season ? "Dėl WAKE abonemento susisiek su Marso Akademija."
          : "Dėl plaukimo susisiek su Marso Akademija."}</p>
      )}
    </div>
  );
}

export function WakeBookingSummary({ product, contact }: { product?: CouponProduct; contact: Contact }) {
  const season = product && isWakeSeasonPass(product);

  return (
    <>
      {product ? (
        <div className="space-y-3 border-t border-line pt-4">
          <p aria-live="polite" className="flex items-baseline justify-between gap-3">
            <span className="text-xs text-copy">Iš viso, su PVM</span>
            <strong className="text-figure">{formatEuro(product.value)}</strong>
          </p>
          <p className="text-xs leading-relaxed text-copy">
            {season ? "Apmokėjus gausi kupono kodą. Abonementą su šiuo kodu aktyvuos komanda parke."
              : "Apmokėjus gausi plaukimo kupono kodą. Plaukimo laiką suderink su Marso Akademija."}
          </p>
          <Cta tone="dark" small className={PLAN_PRIMARY_CLASS} href={`/kuponai?produktas=${encodeURIComponent(product.id)}#uzsakymas`}>
            {season ? "Užsakyti abonementą" : "Užsakyti plaukimą"}
          </Cta>
        </div>
      ) : null}
      <ServiceBookingHelp contact={contact} />
    </>
  );
}

export function WakeServiceBooking({ products, contact }: { products: CouponProduct[]; contact: Contact }) {
  const booking = useWakeBooking(products);

  return (
    <div className="space-y-5">
      <WakeBookingChoices {...booking} />
      <WakeBookingSummary product={booking.product} contact={contact} />
    </div>
  );
}
