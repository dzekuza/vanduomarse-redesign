"use client";

import { DurationPicker } from "@/components/booking/duration-picker";
import { UpsellPicker } from "@/components/booking/upsell-picker";
import type { SaunaPick, SaunaPlan, When } from "@/lib/reservation";
import { OptionGroupLabel } from "./option-card";

interface SaunaHourlyOptionsProps {
  plan: SaunaPlan;
  pick: SaunaPick;
  when: When;
  onChange: (pick: SaunaPick) => void;
}

/** Hourly hire after a start is chosen: how long, and the extras. */
export function SaunaHourlyOptions({ plan, pick, when, onChange }: SaunaHourlyOptionsProps) {
  if (plan.startHour === null) return null;
  return (
    <>
      <div>
        <OptionGroupLabel>Trukmė</OptionGroupLabel>
        <DurationPicker rates={plan.sauna.rates} partySize={when.people} startHour={plan.startHour} maxHours={plan.maxHours} selected={plan.hours} onSelect={(hours) => onChange({ ...pick, hours })} />
      </div>
      {plan.upsells.length ? (
        <div>
          <OptionGroupLabel>Papildomai</OptionGroupLabel>
          <UpsellPicker upsells={plan.upsells} quantities={plan.extras} onChange={(id, qty) => onChange({ ...pick, extras: { ...plan.extras, [id]: qty } })} partySize={when.people} hours={plan.hours} />
        </div>
      ) : null}
    </>
  );
}
