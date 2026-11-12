"use client";

import { DurationPicker } from "@/components/booking/duration-picker";
import { UpsellPicker } from "@/components/booking/upsell-picker";
import { FULL_DAY_HOURS, sessionPrice } from "@/lib/sauna";
import type { SaunaMaster } from "@/lib/sauna-masters";
import type { SaunaPick, SaunaPlan, When } from "@/lib/reservation";
import { MasterPicker } from "./master-picker";
import { OptionGroupLabel } from "./option-card";

interface SaunaHourlyOptionsProps {
  plan: SaunaPlan;
  masters: readonly SaunaMaster[];
  pick: SaunaPick;
  when: When;
  onChange: (pick: SaunaPick) => void;
}

/** Hourly hire after a start is chosen: pirtininkas, how long, and the extras. */
export function SaunaHourlyOptions({ plan, masters, pick, when, onChange }: SaunaHourlyOptionsProps) {
  if (plan.startHour === null) return null;
  return (
    <>
      <MasterPicker
        masters={masters}
        value={pick.masterId}
        onChange={(masterId) => onChange({ ...pick, masterId })}
        note={plan.master ? `Su pirtininku – mažiausiai ${plan.master.minHours} val.` : undefined}
      />
      <div>
        <OptionGroupLabel>Trukmė</OptionGroupLabel>
        <DurationPicker lengths={plan.lengths} price={(h) => sessionPrice(h, when.people, plan.sauna.rates, when.day)} startHour={plan.startHour} maxHours={plan.maxHours} selected={plan.fullDay ? FULL_DAY_HOURS : plan.hours} sessionHours={plan.hours} onSelect={(hours) => onChange({ ...pick, hours })} />
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
