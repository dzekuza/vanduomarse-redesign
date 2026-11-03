"use client";

import { QuadOptions } from "./quad-options";
import { SaunaOptions } from "./sauna-options";
import { StayOptions } from "./stay-options";
import { defaultPick, planAll, planHours, type ActivityId, type PirtisPlan, type Picks, type Plans, type ReservationData, type When } from "@/lib/reservation";

interface ActivitiesStepProps {
  data: ReservationData;
  when: When;
  /** The activity chosen in the tab row above the form. */
  tab: ActivityId;
  picks: Picks;
  plans: Plans;
  /** Removes the activity from the plan (adding happens by choosing something). */
  onToggle: (id: ActivityId) => void;
  onPick: (picks: Picks) => void;
}

function pirtisNotice(plan: PirtisPlan): string {
  if (plan.mode === "session") return plan.session ? "Šiame seanse nepakanka vietų jūsų grupei." : "Pasirink seansą.";
  if (plan.startHour === null) return "Pasirink pradžios laiką.";
  if (plan.mode === "private" && plan.adults > (plan.program.capacity ?? 0)) return `Ši programa tinka iki ${plan.program.capacity} žmonių.`;
  return "Šiuo laiku ši pirtis neprieinama: užimta, uždaryta arba grupė per didelė.";
}

/**
 * The chosen tab's activity. Its choices (programs, quad types, stay types with
 * prices) are always visible; picking one puts the activity in the plan and opens
 * the rest of its options.
 */
export function ActivitiesStep({ data, when, tab, picks, plans, onToggle, onPick }: ActivitiesStepProps) {
  const included = picks[tab] !== undefined;
  // Not in the plan yet: preview the activity with its defaults so the choices can be shown.
  const shown = included ? plans : planAll({ [tab]: defaultPick(tab, data) }, data, when);
  const { pirtis, keturraciai, nakvyne } = shown;
  const notice = !included
    ? undefined
    : tab === "pirtis" && pirtis && !pirtis.ok
      ? pirtisNotice(pirtis)
      : tab === "keturraciai" && keturraciai && !keturraciai.ok
        ? keturraciai.startHour === null
          ? "Pasirink pradžios laiką."
          : "Šiuo laiku tiek keturračių nėra. Pakeisk tipą, skaičių ar laiką."
        : undefined;

  return (
    <div className="space-y-8">
      {notice ? <p role="status" className="text-sm text-rust">{notice}</p> : null}
      {tab === "pirtis" && pirtis ? (
        <SaunaOptions plan={pirtis} data={data.sauna} when={when} included={included} busy={planHours(plans.keturraciai)} onChange={(p) => onPick({ ...picks, pirtis: p })} />
      ) : null}
      {tab === "keturraciai" && keturraciai ? (
        <QuadOptions plan={keturraciai} data={data.quads} when={when} included={included} busy={planHours(plans.pirtis)} onChange={(p) => onPick({ ...picks, keturraciai: p })} />
      ) : null}
      {tab === "nakvyne" && nakvyne ? (
        <StayOptions plan={nakvyne} when={when} included={included} onChange={(p) => onPick({ ...picks, nakvyne: p })} />
      ) : null}
      {included ? (
        <button type="button" onClick={() => onToggle(tab)} className="inline-flex min-h-11 items-center text-sm text-ink/70 underline underline-offset-4 hover:text-rust">
          Pašalinti iš plano
        </button>
      ) : null}
    </div>
  );
}
