"use client";

import { QuadTourCard } from "@/components/quads/quad-tour-card";
import type { QuadPreviewPick } from "@/components/quads/quad-preview-plan";
import { SaunaOptions } from "./sauna-options";
import { StayOptions } from "./stay-options";
import { defaultPick, planAll, planHours, planStay, type ActivityId, type PirtisPlan, type Picks, type Plans, type QuadPlan, type ReservationData, type When } from "@/lib/reservation";

interface ActivitiesStepProps {
  data: ReservationData;
  when: When;
  /** The activity chosen in the tab row above the form. */
  tab: ActivityId;
  sessionId: string | null;
  onSessionSelectedFocus?: () => void;
  onSessionDay: (day: string) => void;
  picks: Picks;
  plans: Plans;
  stayNights: number | null;
  /** Removes the activity from the plan (adding happens by choosing something). */
  onRemove: (id: ActivityId) => void;
  onPick: (picks: Picks) => void;
  onPeople: (people: number) => void;
  previewQuad: QuadPreviewPick | null;
  quadPreviewHours: readonly number[];
  onQuadPreview: (pick: QuadPreviewPick | null) => void;
}

function pirtisNotice(plan: PirtisPlan): string {
  if (plan.mode === "session") return plan.session ? "Šiame seanse nepakanka vietų jūsų grupei." : "Pasirink seansą.";
  if (plan.startHour === null) return "Pasirink pradžios laiką.";
  if (plan.mode === "private" && plan.adults > (plan.program.capacity ?? 0)) return `Ši programa tinka iki ${plan.program.capacity} žmonių.`;
  return "Šiuo laiku ši pirtis neprieinama: užimta, uždaryta arba grupė per didelė.";
}

function quadNotice(plan: QuadPlan): string {
  if (plan.startHour === null) return "Pasirink pradžios laiką.";
  return "Šiuo laiku pasirinkto keturračių derinio nėra. Pakeisk kiekį arba laiką.";
}

/**
 * The chosen tab's activity. Stay types and rates are visible before date selection.
 */
export function ActivitiesStep({ data, when, tab, sessionId, onSessionDay, onSessionSelectedFocus, picks, plans, stayNights, onRemove, onPick, onPeople, previewQuad, quadPreviewHours, onQuadPreview }: ActivitiesStepProps) {
  const included = picks[tab] !== undefined;
  // Not in the plan yet: preview the activity with its defaults so the choices can be shown.
  let shown = plans;
  if (tab === "nakvyne") {
    shown = { nakvyne: plans.nakvyne ?? planStay({ ...(picks.nakvyne ?? defaultPick(tab, data)), nights: stayNights ?? 1 }, data.cabin, when.day) };
  } else if (!included) {
    shown = planAll({ [tab]: defaultPick(tab, data) }, data, when);
  }
  const { pirtis, keturraciai, nakvyne } = shown;
  const notice = !included
    ? undefined
    : tab === "pirtis" && pirtis && !pirtis.ok
      ? pirtisNotice(pirtis)
      : tab === "keturraciai" && keturraciai && !keturraciai.ok
        ? quadNotice(keturraciai)
        : undefined;

  return (
    <div className="space-y-8">
      {notice ? <p role="status" className="text-sm text-rust-ink">{notice}</p> : null}
      {tab === "pirtis" && pirtis ? (
        <SaunaOptions
          plan={pirtis}
          data={data.sauna}
          when={when}
          included={included}
          busy={[...planHours(plans.keturraciai), ...quadPreviewHours]}
          sessionId={sessionId}
          onSessionDay={onSessionDay}
          onSessionSelectedFocus={onSessionSelectedFocus}
          onChange={(p) => onPick({ ...picks, pirtis: p })}
          onPeople={onPeople}
          onRemove={() => onRemove("pirtis")}
        />
      ) : null}
      {tab === "keturraciai" ? (
        <QuadTourCard
          key={when.day}
          data={data.quads}
          when={when}
          busy={planHours(plans.pirtis)}
          pick={previewQuad}
          onChange={onQuadPreview}
        />
      ) : null}
      {tab === "nakvyne" && nakvyne ? (
        <StayOptions plan={nakvyne} datesSelected={stayNights !== null} included={included} onChange={(p) => onPick({ ...picks, nakvyne: p })} onRemove={() => onRemove("nakvyne")} />
      ) : null}
      {included && (tab === "keturraciai" || (tab === "pirtis" && !pirtis)) ? (
        <button type="button" onClick={() => onRemove(tab)} className="inline-flex min-h-11 items-center text-sm text-ink/70 underline underline-offset-4 hover:text-rust">
          Pašalinti iš plano
        </button>
      ) : null}
    </div>
  );
}
