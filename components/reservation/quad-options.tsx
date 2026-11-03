"use client";

import { Stepper } from "@/components/booking/stepper";
import { DurationGrid, StartGrid } from "@/components/quads/quad-time-pickers";
import type { QuadPageData } from "@/lib/data/public-types";
import { quadsNeeded, type QuadPick, type QuadPlan, type When } from "@/lib/reservation";
import { pastHourOn } from "@/lib/sauna";
import { OptionCard, OptionGroupLabel } from "./option-card";

interface QuadOptionsProps {
  plan: QuadPlan;
  data: QuadPageData;
  when: When;
  /** Already in the plan: only then are the count, start and duration shown. */
  included: boolean;
  /** Hours the sauna holds in the plan: the rental can't overlap them. */
  busy: readonly number[];
  onChange: (pick: QuadPick) => void;
}

/** Which quad, how many (at least enough for the group) and for how long. */
export function QuadOptions({ plan, data, when, included, busy, onChange }: QuadOptionsProps) {
  const { type, units, hours } = plan;
  const pick: QuadPick = { typeId: type.id, startHour: plan.startHour, units, hours };
  return (
    <>
      <div>
        <OptionGroupLabel>Keturratis</OptionGroupLabel>
        <div role="group" aria-label="Keturračio tipas" className="grid gap-3 sm:grid-cols-2">
          {data.types.map((t) => (
            <OptionCard
              key={t.id}
              eyebrow={t.seats === 1 ? "1 vieta" : `${t.seats} vietos`}
              title={t.name}
              text={t.description}
              meta={`${t.pricePerHour} € / val.`}
              selected={included && t.id === type.id}
              disabled={t.units === 0}
              onClick={() => onChange({ ...pick, typeId: t.id, units: 1 })}
            />
          ))}
        </div>
      </div>
      {included ? (
        <>
        <Stepper
          label={`Keturračių (grupei reikia bent ${quadsNeeded(type, when.people)})`}
          value={units}
          onChange={(n) => onChange({ ...pick, units: n })}
          min={quadsNeeded(type, when.people)}
          max={Math.max(1, Math.min(type.units, 20))}
        />
        <div>
          <OptionGroupLabel>Pradžios laikas</OptionGroupLabel>
          <StartGrid
            type={type}
            units={units}
            settings={data.settings}
            taken={data.taken}
            day={when.day}
            busy={busy}
            pastHour={pastHourOn(when.day, data.today, data.nowHour)}
            selected={plan.startHour}
            onSelect={(startHour) => onChange({ ...pick, startHour })}
          />
        </div>
        {plan.startHour !== null && plan.ok ? (
          <div>
            <OptionGroupLabel>Trukmė</OptionGroupLabel>
            <DurationGrid
              type={type}
              units={units}
              settings={data.settings}
              taken={data.taken}
              day={when.day}
              busy={busy}
              startHour={plan.startHour}
              selected={hours}
              onSelect={(h) => onChange({ ...pick, hours: h })}
            />
          </div>
        ) : null}
        </>
      ) : null}
    </>
  );
}
