"use client";

import { useState } from "react";
import { Stepper } from "@/components/booking/stepper";
import type { SaunaPageData } from "@/lib/data/public-types";
import { MAX_PEOPLE, pickForRow, pickFromPlan, rowSelected, sessionRows, type PirtisPlan, type SaunaPick, type SessionRow, type When } from "@/lib/reservation";
import { MasterPicker } from "./master-picker";
import { matchesSaunaFilter, SaunaFilters, type SaunaFilter } from "./sauna-filters";
import { SaunaHourlyOptions } from "./sauna-hourly-options";
import { SaunaSessionDialog } from "./sauna-session-dialog";
import { closeSessionInfo } from "./session-info-link";
import { SessionList } from "./session-list";

interface SaunaOptionsProps {
  plan: PirtisPlan;
  data: SaunaPageData;
  when: When;
  /** Already in the plan: only then are the follow-up options (children, length, extras) shown. */
  included: boolean;
  /** Hours the quads hold in the plan: seansai overlapping them are blocked. */
  busy: readonly number[];
  sessionId: string | null;
  onSessionSelectedFocus?: () => void;
  onSessionDay: (day: string) => void;
  onChange: (pick: SaunaPick) => void;
  onPeople: (people: number) => void;
  onRemove: () => void;
}

/** The day's scheduled sessions and private programs, followed by options for the selected sauna. */
export function SaunaOptions({ plan, data, when, included, busy, sessionId, onSessionDay, onSessionSelectedFocus, onChange, onPeople, onRemove }: SaunaOptionsProps) {
  const [filter, setFilter] = useState<SaunaFilter>(() => (sessionId || (included && plan.mode === "session") ? "sessions" : "private"));
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const pick = pickFromPlan(plan, data);
  const rows = sessionRows(data, when.day, busy);
  const visibleRows = rows.filter((row) => matchesSaunaFilter(row, filter));
  const selected = (row: SessionRow) => included && rowSelected(row, plan);
  const showSelection = included && visibleRows.some(selected);
  const event = sessionId ? data.events.find((item) => item.key === sessionId) : undefined;
  const session = event && (event.date === when.day ? rows : sessionRows(data, event.date))
    .find((row) => row.eventId === event.key);

  function quantity(row: SessionRow) {
    const max = Math.max(1, Math.min(MAX_PEOPLE, row.maxPeople));
    return {
      max,
      value: selected(row) ? when.people : Math.min(quantities[row.key] ?? when.people, max),
      onChange: (people: number) => {
        if (selected(row)) onPeople(people);
        else setQuantities((current) => ({ ...current, [row.key]: people }));
      },
    };
  }

  function select(row: SessionRow, people: number, startHour: number | null) {
    onChange(pickForRow(row, pick, startHour));
    onPeople(people);
  }

  return (
    <>
      {/* Same gap below the type chips as below the calendar toggle, so the first card lines up with the calendar. */}
      <div className="space-y-4">
        <SaunaFilters rows={rows} filter={filter} onChange={setFilter} />
        <SessionList
          key={when.day}
          rows={visibleRows}
          emptyMessage={filter === "private"
            ? "Šią dieną privačios pirties laikų nėra. Pasirink seansą arba kitą dieną."
            : "Šią dieną seansų nėra. Pasirink privačią pirtį arba kitą dieną."}
          selected={selected}
          selectedStart={plan.mode === "private" ? plan.startHour : null}
          quantity={quantity}
          onRemove={onRemove}
          onSelect={select}
        />
      </div>
      <SaunaSessionDialog
        open={Boolean(sessionId)}
        details={event && session ? { event, row: session, quantity: quantity(session), selected: selected(session) } : undefined}
        onClose={closeSessionInfo}
        onSelectedFocus={onSessionSelectedFocus}
        onSelect={() => {
          if (!session || !event || session.blocked) return;
          if (!selected(session)) {
            onSessionDay(event.date);
            select(session, quantity(session).value, null);
          }
          closeSessionInfo();
        }}
      />
      {showSelection && plan.mode === "session" && plan.program?.pricing === "family" ? (
        <Stepper label={`Vaikų grupėje (suaugusių: ${plan.adults})`} value={plan.children} onChange={(children) => onChange({ ...pick, children })} min={0} max={Math.max(0, when.people - 1)} />
      ) : null}
      {included && plan.mode === "private" ? (
        <MasterPicker masters={data.masters} value={pick.masterId} onChange={(masterId) => onChange({ ...pick, masterId })} />
      ) : null}
      {included && plan.mode === "hourly" ? <SaunaHourlyOptions plan={plan} masters={data.masters} pick={pick} when={when} onChange={onChange} /> : null}
      {included && !rows.some(selected) ? (
        <button type="button" onClick={onRemove} className="inline-flex min-h-11 items-center text-sm text-ink/70 underline underline-offset-4 hover:text-rust">
          Pašalinti iš plano
        </button>
      ) : null}
    </>
  );
}
