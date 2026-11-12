"use client";

import { ListBulletsIcon, TicketIcon, WavesIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { BookingPrice } from "@/components/booking/booking-price";
import { Cta } from "@/components/cta";
import { BOOKING_CHOICE_CLASS, FilterChip } from "@/components/events/filter-chip";
import { BookingDetailCard } from "@/components/reservation/booking-detail-card";
import { PLAN_PRIMARY_CLASS } from "@/components/reservation/plan-actions";
import type { Contact } from "@/lib/contacts";
import { formatEuro, isWakeSeasonPass, type WakeOffer } from "@/lib/coupons";
import { ServiceBookingHelp } from "./service-booking-help";
import { WakeCheckoutDialog } from "./wake-checkout-dialog";

const TYPES = [
  { id: "ride", label: "Plaukimas" },
  { id: "season", label: "WAKE abonementas" },
] as const;

type WakeType = (typeof TYPES)[number]["id"];

export function useWakeBooking(products?: WakeOffer[], { autoSelect = false } = {}) {
  const [type, setType] = useState<WakeType | null>(autoSelect ? "ride" : null);
  const [selected, setSelected] = useState<Partial<Record<WakeType, string>>>({});
  const offers: Record<WakeType, WakeOffer[]> = { ride: [], season: [] };
  for (const product of products ?? []) {
    offers[isWakeSeasonPass(product) ? "season" : "ride"].push(product);
  }
  const offerType = type ?? (offers.ride.length > 0 ? "ride" : "season");
  const options = offers[offerType];
  const product = type
    ? options.find(({ id }) => id === selected[type]) ?? (autoSelect ? options[0] : undefined)
    : undefined;

  return {
    type,
    setType,
    offers,
    offerType,
    options,
    product,
    selectProduct: (id: string) => {
      if (type) setSelected((current) => ({ ...current, [type]: id }));
    },
  };
}

export function WakeBookingChoices({ type, setType, offers, offerType, options, product, selectProduct }: ReturnType<typeof useWakeBooking>) {
  const season = offerType === "season";
  const OfferIcon = season ? TicketIcon : WavesIcon;

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-3 flex items-center gap-2 text-sm font-bold">
          <ListBulletsIcon size={18} aria-hidden /> Paslauga
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
      {options.length > 0 ? (
        <fieldset disabled={type === null} className="@container min-w-0 disabled:pointer-events-none disabled:opacity-50">
          <legend className="mb-3 flex items-center gap-2 text-sm font-bold">
            <OfferIcon size={18} aria-hidden /> {season ? "Abonementai" : "Plaukimo pasirinkimai"}
          </legend>
          <div className="grid gap-3 lg:@md:grid-cols-2">
            {options.map((option) => (
              <BookingDetailCard
                key={option.id}
                eyebrow={season ? "Abonementas" : "Plaukimas"}
                title={option.name}
                description={option.description}
                price={formatEuro(option.value)}
                selected={option.id === product?.id}
                onSelect={() => selectProduct(option.id)}
              />
            ))}
          </div>
        </fieldset>
      ) : type ? (
        <p className="text-sm text-copy">{season ? "Dėl WAKE abonemento susisiek su Marso Akademija."
          : "Dėl plaukimo susisiek su Marso Akademija."}</p>
      ) : null}
    </div>
  );
}

export function WakeBookingSummary({ product, contact }: { product?: WakeOffer; contact: Contact }) {
  const season = product && isWakeSeasonPass(product);
  const [checkout, setCheckout] = useState(false);

  return (
    <>
      <div className="space-y-3 border-t border-line pt-4">
        <BookingPrice
          amount={formatEuro(product?.value ?? 0)}
          note={!product ? "Pasirink pasiūlymą, kad matytum kainą."
            : product.planId ? "Užsiregistruosi (kontaktai, nuotrauka, taisyklės) ir apmokėsi. Abonementas priskiriamas tau, apyrankę parke priskirs darbuotojas."
            : season ? "Apmokėjus gausi kupono kodą. Abonementą su šiuo kodu aktyvuos komanda parke."
              : "Apmokėjus gausi plaukimo kupono kodą. Plaukimo laiką suderink su Marso Akademija."}
        />
        <Cta tone="dark" small className={PLAN_PRIMARY_CLASS}
          href={product?.planId ? `/registracija?abonementas=${encodeURIComponent(product.planId)}` : undefined}
          onClick={product?.planId ? undefined : () => setCheckout(true)}
          disabled={!product}>
          {!product ? "Užsakyti" : season ? "Užsakyti abonementą" : "Užsakyti plaukimą"}
        </Cta>
      </div>
      {product && !product.planId ? <WakeCheckoutDialog product={product} open={checkout} onClose={() => setCheckout(false)} /> : null}
      <ServiceBookingHelp contact={contact} />
    </>
  );
}

export function WakeServiceBooking({ products, contact }: { products: WakeOffer[]; contact: Contact }) {
  const booking = useWakeBooking(products, { autoSelect: true });

  return (
    <div className="space-y-5">
      <WakeBookingChoices {...booking} />
      <WakeBookingSummary product={booking.product} contact={contact} />
    </div>
  );
}
