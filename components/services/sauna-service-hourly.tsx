"use client";

import { ClockIcon, UsersIcon, UserIcon } from "@phosphor-icons/react";
import { FilterChip } from "@/components/events/filter-chip";
import { hoursLabel, pricesFor, type Sauna } from "@/lib/sauna";
import type { SaunaMaster } from "@/lib/sauna-masters";

const LEGEND = "mb-3 flex items-center gap-2 text-sm font-bold";
const TILE = "min-h-14 min-w-0 flex-col justify-center gap-1 px-1 py-2 text-center leading-tight";

interface SaunaServiceHourlyProps {
  sauna: Sauna;
  masters: readonly SaunaMaster[];
  /** Chosen day (yyyy-mm-dd), or null before a date is picked: every length is shown, prices for both day types. */
  day: string | null;
  /** The length the guest asked for; the one shown as chosen is the nearest offered. */
  hours: number;
  onHours: (hours: number) => void;
  masterId: string | null;
  onMaster: (id: string | null) => void;
  disabled?: boolean;
}

const euro = (n: number) => `${String(n).replace(".", ",")} €`;

/** Length and pirtininkas of a private booking, asked before the date (the price follows the day). */
export function SaunaServiceHourly({ sauna, masters, day, hours, onHours, masterId, onMaster, disabled }: SaunaServiceHourlyProps) {
  const { rates } = sauna;
  const master = masters.find((m) => m.id === masterId) ?? null;
  const floor = master?.minHours ?? 0;
  const { weekdayPrices, weekendPrices } = rates;
  const lengths = [...new Set([...Object.keys(weekdayPrices), ...Object.keys(weekendPrices)].map(Number))]
    .filter((hours) => hours >= floor)
    .sort((a, b) => a - b);
  const dayPrices = day === null ? null : pricesFor(rates, day);
  const offered = (hours: number) => dayPrices === null || dayPrices[hours] !== undefined;
  const availableLengths = lengths.filter(offered);
  const chosen = availableLengths.find((length) => length >= hours) ?? availableLengths.at(-1);
  const basePrice = chosen === undefined ? undefined : dayPrices?.[chosen];
  const weekday = chosen === undefined ? undefined : weekdayPrices[chosen];
  const weekend = chosen === undefined ? undefined : weekendPrices[chosen];

  return (
    <div className="space-y-5">
      <fieldset disabled={disabled}>
        <legend className={LEGEND}><ClockIcon size={18} aria-hidden /> Trukmė</legend>
        <div className="grid grid-cols-4 gap-2">
          {lengths.map((hours) => {
            const tariffs = [weekdayPrices[hours], weekendPrices[hours]].filter((price) => price !== undefined);
            const lowest = Math.min(...tariffs);
            const price = dayPrices === null ? lowest : dayPrices[hours];
            const from = dayPrices === null && tariffs.some((tariff) => tariff !== lowest);

            return (
              <FilterChip key={hours} active={hours === chosen} disabled={!offered(hours)} onClick={() => onHours(hours)} className={TILE}>
                <span className="font-bold">{hoursLabel(hours)}</span>
                <span className={hours === chosen ? "text-dust/80" : "text-copy"}>
                  {price === undefined ? "–" : `${from ? "nuo " : ""}${euro(price)}`}
                </span>
              </FilterChip>
            );
          })}
        </div>
        {chosen !== undefined ? (
          <p className="mt-2 text-sm text-copy">
            Bazinė kaina{" "}
            {basePrice !== undefined ? (
              <strong className="text-ink">{euro(basePrice)}</strong>
            ) : (
              <>
                <strong className="text-ink">{weekday === undefined ? "–" : euro(weekday)}</strong> I–IV ·{" "}
                <strong className="text-ink">{weekend === undefined ? "–" : euro(weekend)}</strong> V–VII
              </>
            )}
          </p>
        ) : null}
      </fieldset>

      {masters.length > 0 ? (
        <fieldset disabled={disabled}>
          <legend className={LEGEND}><UsersIcon size={18} aria-hidden /> Pirtininkas</legend>
          <div className="grid grid-cols-2 gap-2">
            <FilterChip active={masterId === null} onClick={() => onMaster(null)} className="min-h-14 min-w-0 flex-col items-start justify-center gap-1 px-3 py-2 text-left">
              <span className="font-bold">Be pirtininko</span>
              <span className={masterId === null ? "text-dust/80" : "text-copy"}>0 €</span>
            </FilterChip>
            {masters.map((m) => (
              <FilterChip key={m.id} active={masterId === m.id} onClick={() => onMaster(m.id)} className="min-h-14 min-w-0 flex-col items-start justify-center gap-1 px-3 py-2 text-left">
                <span className="font-bold">{masters.length === 1 ? "Su pirtininku" : m.name}</span>
                <span className={masterId === m.id ? "text-dust/80" : "text-copy"}>+{euro(m.price)}</span>
              </FilterChip>
            ))}
          </div>
          {master ? <p className="mt-2 text-xs text-copy">Su pirtininku pirtis rezervuojama bent {master.minHours} val.</p> : null}
        </fieldset>
      ) : null}

    </div>
  );
}

interface SaunaServicePeopleProps {
  sauna: Sauna;
  people: number;
  onPeople: (people: number) => void;
  disabled?: boolean;
}

/** Group size slider with the included-guests note; asked after the time. */
export function SaunaServicePeople({ sauna, people, onPeople, disabled }: SaunaServicePeopleProps) {
  const { rates } = sauna;
  const surcharge = Math.max(0, people - rates.includedGuests) * rates.extraGuestFee;
  return (
    <fieldset disabled={disabled} className="space-y-3 border border-line p-3">
        <legend className="sr-only">Asmenų skaičius</legend>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="sauna-people" className="flex items-center gap-2 text-sm font-bold"><UserIcon size={18} aria-hidden /> Asmenų skaičius</label>
          <output htmlFor="sauna-people" className="bg-ink px-2 py-1 text-xs font-bold text-dust">{people} asm.</output>
        </div>
        <input
          id="sauna-people"
          type="range"
          min={1}
          max={rates.maxParty}
          value={people}
          onChange={(e) => onPeople(Number(e.target.value))}
          className="block h-11 w-full accent-ink"
        />
        <div className="flex justify-between text-xs text-copy"><span>1 asm.</span><span>{rates.maxParty} asm.</span></div>
        <p className="border-t border-line pt-2 text-xs text-copy">
          Į kainą įskaičiuota iki {rates.includedGuests} asm. Papildomas svečias +{euro(rates.extraGuestFee)}.
          {surcharge > 0 ? ` Jūsų grupei: +${euro(surcharge)}.` : ""}
        </p>
    </fieldset>
  );
}
