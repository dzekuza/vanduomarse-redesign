"use client";

import { useState } from "react";
import { Stepper } from "@/components/booking/stepper";
import type { SaunaPageData } from "@/lib/data/public-types";
import { pickForRow, pickFromPlan, rowSelected, sessionRows, type PirtisPlan, type SaunaPick, type When } from "@/lib/reservation";
import { matchesSaunaFilter, SaunaFilters, type SaunaFilter } from "./sauna-filters";
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
  onPeople: (people: number) => void;
  onRemove: () => void;
}

/** The day's scheduled sessions and private programs, followed by options for the selected sauna. */
export function SaunaOptions({ plan, data, when, included, busy, onChange, onPeople, onRemove }: SaunaOptionsProps) {
  const [filter, setFilter] = useState<SaunaFilter>("all");
  const pick = pickFromPlan(plan, data);
  const rows = sessionRows(data, when.day, busy);
  const visibleRows = rows.filter((row) => matchesSaunaFilter(row, filter));
  const selected = (row: (typeof rows)[number]) => included && rowSelected(row, plan);
  const showSelection = included && (filter === "all" || visibleRows.some(selected));

  return (
    <>
      <SaunaFilters rows={rows} filter={filter} onChange={setFilter} />
      <SessionList
        key={when.day}
        rows={visibleRows}
        emptyMessage={filter === "all"
          ? "Šią dieną laisvų pirties laikų nėra. Pasirink kitą dieną."
          : "Šią dieną pagal šį filtrą pasirinkimų nėra. Pasirink kitą filtrą arba dieną."}
        people={when.people}
        selected={selected}
        selectedStart={plan.mode === "private" ? plan.startHour : null}
        onPeople={onPeople}
        onRemove={onRemove}
        onSelect={(row, people, startHour) => {
          onChange(pickForRow(row, plan, data, startHour));
          onPeople(people);
        }}
      />
      {showSelection && plan.mode === "session" && plan.program?.pricing === "family" ? (
        <Stepper label={`Vaikų grupėje (suaugusių: ${plan.adults})`} value={plan.children} onChange={(children) => onChange({ ...pick, children })} min={0} max={Math.max(0, when.people - 1)} />
      ) : null}
      {included && plan.mode === "hourly" ? <SaunaHourlyOptions plan={plan} pick={pick} when={when} onChange={onChange} /> : null}
      {included && !rows.some(selected) ? (
        <button type="button" onClick={onRemove} className="inline-flex min-h-11 items-center text-sm text-ink/70 underline underline-offset-4 hover:text-rust">
          Pašalinti iš plano
        </button>
      ) : null}
    </>
  );
}
