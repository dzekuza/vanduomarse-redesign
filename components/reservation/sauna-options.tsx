"use client";

import { Stepper } from "@/components/booking/stepper";
import type { SaunaPageData } from "@/lib/data/public-types";
import { pickForRow, pickFromPlan, rowSelected, sessionRows, type PirtisPlan, type SaunaPick, type When } from "@/lib/reservation";
import { SaunaHourlyOptions } from "./sauna-hourly-options";
import { SessionList } from "./session-list";

interface SaunaOptionsProps {
  plan: PirtisPlan;
  data: SaunaPageData;
  when: When;
  /** Already in the plan: only then are the follow-up options (children, length, extras) shown. */
  included: boolean;
  /** Hours the quads hold in the plan: seansai overlapping them are blocked. */
  busy: readonly number[];
  onChange: (pick: SaunaPick) => void;
}

/** Pirtis: the day's seansai in one list (sessions, private programs, hourly starts), then what the chosen one still needs. */
export function SaunaOptions({ plan, data, when, included, busy, onChange }: SaunaOptionsProps) {
  const pick = pickFromPlan(plan, data);
  const rows = sessionRows(data, when, busy);
  return (
    <>
      <SessionList rows={rows} selected={(row) => included && rowSelected(row, plan)} onSelect={(row) => onChange(pickForRow(row, plan, data))} />
      {included && plan.mode === "session" && plan.program.pricing === "family" ? (
        <Stepper label={`Vaikų grupėje (suaugusių: ${plan.adults})`} value={plan.children} onChange={(children) => onChange({ ...pick, children })} min={0} max={Math.max(0, when.people - 1)} />
      ) : null}
      {included && plan.mode === "hourly" ? <SaunaHourlyOptions plan={plan} pick={pick} when={when} onChange={onChange} /> : null}
    </>
  );
}
