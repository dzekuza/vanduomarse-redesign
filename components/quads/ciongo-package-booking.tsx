"use client";

import { BedIcon, FireIcon, PackageIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { BookingPrice } from "@/components/booking/booking-price";
import { QuoteRequestForm } from "@/components/booking/quote-request-form";
import { CompactStepper } from "@/components/booking/stepper";
import { BOOKING_CHOICE_CLASS, FilterChip } from "@/components/events/filter-chip";
import { bookingDayAvailability } from "@/components/reservation/booking-day-availability";
import { DateField } from "@/components/reservation/date-field";
import { useLiveData } from "@/components/services/live-activity";
import { Switch } from "@/components/ui/switch";
import {
  CIONGO_DEFAULT_PEOPLE,
  CIONGO_OVERNIGHT_PER_PERSON,
  CIONGO_SAUNA_HOURS,
  CIONGO_SAUNA_IDS,
  CIONGO_SAUNA_LABEL,
  ciongoEstimate,
  ciongoFromPrice,
  ciongoPackage,
  ciongoPackagesByPrice,
  ciongoSaunaPrice,
  type CiongoPriceSources,
  type CiongoSaunaChoice,
} from "@/lib/ciongo-packages";
import { formatMoney } from "@/lib/event-pricing";
import { quadTourMaxUnits } from "@/lib/quads";
import { RESERVATION_DAYS } from "@/lib/reservation";
import { dateKey, longDateLabel, nextDays } from "@/lib/sauna";
import { CiongoPackageDialog } from "./ciongo-package-dialog";
import { useCiongoPackage } from "./ciongo-package-state";
import { quadTourStarts } from "./quad-tour-plan";

const SAUNA_CHOICES: CiongoSaunaChoice[] = ["suomiska", "malkine"];

/** The CIONGO packages' price sources from the live page data: the active tour route and the two saunas. */
export function useCiongoSources(): CiongoPriceSources {
  const data = useLiveData();
  return useMemo(() => {
    const rates = (choice: CiongoSaunaChoice) => data.sauna.saunas.find(({ id, active }) => id === CIONGO_SAUNA_IDS[choice] && active)?.rates;
    const suomiska = rates("suomiska");
    const malkine = rates("malkine");
    return {
      route: data.quads.tourRoutes.find(({ active }) => active) ?? null,
      saunas: { ...(suomiska ? { suomiska } : {}), ...(malkine ? { malkine } : {}) },
    };
  }, [data]);
}

/**
 * The booking panel of the quads page (the only way to book there since 2026-11-27; tours alone stay on /rezervacija): a CIONGO package, the sauna (Finnish or wood-fired with a sauna master), the group size,
 * optional cabins and a date, priced live and sent to the team as an inquiry (ADR-0142). Nothing is held until staff confirm.
 */
export function CiongoPackageBooking() {
  const data = useLiveData();
  const sources = useCiongoSources();
  const { packageId, setPackageId } = useCiongoPackage();
  const pkg = ciongoPackage(packageId);
  const route = sources.route;
  const minPeople = route?.minUnits ?? 5;
  const maxPeople = route?.maxUnits ?? 15;
  const [people, setPeople] = useState(CIONGO_DEFAULT_PEOPLE);
  const [sauna, setSauna] = useState<CiongoSaunaChoice>("suomiska");
  const [overnight, setOvernight] = useState(false);
  const [date, setDate] = useState<Date | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const days = useMemo(() => nextDays(data.quads.today, RESERVATION_DAYS), [data.quads.today]);
  const day = date ? dateKey(date) : null;
  const saunaOffered = SAUNA_CHOICES.filter((choice) => sources.saunas[choice]);
  const chosenSauna = saunaOffered.includes(sauna) ? sauna : saunaOffered[0] ?? "suomiska";
  const estimate = pkg ? ciongoEstimate(pkg, { people, sauna: chosenSauna, overnight, day }, sources) : null;
  const loaded = useMemo(() => new Set(days.map(dateKey)), [days]);

  // Laisva / Pilna like the other booking forms: enough quads free for the whole group (and its guides) at some start.
  // Days past the loaded availability window get no mark; the team confirms those.
  function dayDetails(candidate: Date) {
    const key = dateKey(candidate);
    if (!route || !loaded.has(key)) return undefined;
    const available = quadTourStarts(data.quads, key, route).some(({ free }) => quadTourMaxUnits(route, free) >= people);
    return bookingDayAvailability(available, false);
  }
  const withCabins = pkg?.overnight === "included" || (pkg?.overnight === "optional" && overnight);

  return (
    <div className="space-y-5">
      <fieldset className="@container min-w-0">
        <legend className="mb-3 flex items-center gap-2 text-sm font-bold"><PackageIcon size={18} aria-hidden /> Tipas</legend>
        <div className="grid grid-cols-1 gap-2 @xs:grid-cols-2">
          {ciongoPackagesByPrice(sources).map((option) => {
            const active = option.id === pkg?.id;
            const from = ciongoFromPrice(option, sources).min;
            return (
              <div key={option.id} className="relative isolate min-w-0">
                <FilterChip active={active} onClick={() => setPackageId(option.id)} className={`h-full w-full ${BOOKING_CHOICE_CLASS} pr-11`}>
                  <span className="font-bold">{option.title}</span>
                  <span className={`text-xs leading-snug ${active ? "text-dust/80" : "text-copy"}`}>{option.summary}</span>
                  <span className={`text-xs font-bold ${active ? "text-dust" : ""}`}>nuo {formatMoney({ min: from, max: from })} / {CIONGO_DEFAULT_PEOPLE} žm.</span>
                </FilterChip>
                <CiongoPackageDialog pkg={option} sources={sources} onChoose={() => setPackageId(option.id)} className={`absolute top-0 right-0 ${active ? "text-dust" : "text-ink"}`} />
              </div>
            );
          })}
        </div>
      </fieldset>

      {pkg && estimate ? (
        <>
          <fieldset className="@container min-w-0">
            <legend className="mb-3 flex items-center gap-2 text-sm font-bold"><FireIcon size={18} aria-hidden /> Pirtis · {CIONGO_SAUNA_HOURS} val.</legend>
            <div className="grid grid-cols-1 gap-2 @xs:grid-cols-2">
              {saunaOffered.map((choice) => {
                const active = choice === chosenSauna;
                const price = ciongoSaunaPrice(choice, people, sources, day);
                return (
                  <FilterChip key={choice} active={active} onClick={() => setSauna(choice)} className={`h-full w-full ${BOOKING_CHOICE_CLASS}`}>
                    <span className="font-bold">{choice === "suomiska" ? "Suomiška pirtis" : "Malkinė pirtis su pirtininku"}</span>
                    <span className={`text-xs ${active ? "text-dust/80" : "text-copy"}`}>{price ? formatMoney(price) : ""}{day ? "" : " · I–IV / V–VII"}</span>
                  </FilterChip>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-2">
            <CompactStepper label="Žmonių (po 1 keturratyje)" value={people} min={minPeople} max={maxPeople} onChange={setPeople} editable />
            <p className="text-xs text-copy">Nuo {minPeople} iki {maxPeople} žmonių.{route?.groupFrom ? ` Nuo ${route.groupFrom} keturračių taikoma grupės kaina.` : ""}</p>
          </div>

          {pkg.overnight === "optional" ? (
            <div className="space-y-1">
              <div className="flex min-h-11 items-center justify-between gap-3">
                <label htmlFor="ciongo-overnight" className="flex items-center gap-2 text-sm font-bold"><BedIcon size={18} aria-hidden /> Nakvynė</label>
                <Switch id="ciongo-overnight" checked={overnight} onCheckedChange={setOvernight} />
              </div>
              <p className="text-xs text-copy">Nameliuose visiems dalyviams, {CIONGO_OVERNIGHT_PER_PERSON.min}–{CIONGO_OVERNIGHT_PER_PERSON.max} € žmogui.</p>
            </div>
          ) : null}

          <div className="space-y-2">
            <DateField date={date} days={days} dayDetails={dayDetails} allowFutureDates open={calendarOpen} onOpenChange={setCalendarOpen} onSelect={(next) => { setDate(next); setCalendarOpen(false); }} onClear={() => setDate(null)} />
            <p className="text-xs text-copy">„Laisva“ – tą dieną yra laisvų keturračių visai grupei. Pirtis I–IV pigesnė nei V–VII; laiką patvirtinsime.</p>
          </div>

          <div className="space-y-3 border-t border-line pt-4">
            <p className="text-micro uppercase text-copy">{pkg.title}</p>
            <ul className="space-y-2">
              {estimate.lines.map((line) => (
                <li key={line.id} className="flex items-start justify-between gap-3 text-xs">
                  <span className="min-w-0">
                    <span className="block font-bold">{line.title}</span>
                    <span className="block text-copy">{line.detail}</span>
                  </span>
                  <span className="shrink-0 font-bold tabular-nums">{formatMoney(line.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-line pt-4">
              <BookingPrice
                amount={formatMoney(estimate.total)}
                note={`${formatMoney(estimate.perPerson)} vienam žmogui. Preliminari kaina: maisto meniu ir laiką suderinsime.`}
              />
            </div>
            <QuoteRequestForm
              kicker="CIONGO paketas"
              idPrefix="ciongo"
              total={estimate.total}
              messageLines={() => [
                `Paketas · ${pkg.title}`,
                `Pirtis · ${CIONGO_SAUNA_LABEL[chosenSauna].title}`,
                withCabins ? "Su nakvyne nameliuose" : "",
                date ? `Data · ${longDateLabel(date)}` : "Data dar nepasirinkta",
              ]}
              request={() => ({
                eventType: `CIONGO paketas · ${pkg.title}`,
                date: day ?? "",
                guests: people,
                space: [CIONGO_SAUNA_LABEL[chosenSauna].title, withCabins ? "nakvynė" : ""].filter(Boolean).join(" · "),
                estimateMin: estimate.total.min,
                estimateMax: estimate.total.max,
                calculatorInput: {
                  ciongoPackage: pkg.id,
                  sauna: chosenSauna,
                  people,
                  overnight: withCabins,
                  lines: estimate.lines,
                  // Staff can book the sauna straight from the request (`inquirySaunas` in the admin).
                  saunas: { [CIONGO_SAUNA_IDS[chosenSauna]]: { hours: CIONGO_SAUNA_HOURS, startHour: pkg.saunaStart } },
                },
              })}
            />
          </div>
        </>
      ) : (
        <p className="text-xs text-copy">Pasirink tipą: kainą skaičiuosime pagal žmonių skaičių, pirtį ir datą.</p>
      )}
    </div>
  );
}
