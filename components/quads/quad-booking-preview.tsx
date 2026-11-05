"use client";

import { useMemo, useState } from "react";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { MobilePlanDock } from "@/components/reservation/mobile-plan-dock";
import { PlanPanel } from "@/components/reservation/plan-panel";
import type { PlanQuantities } from "@/components/reservation/plan-quantities";
import { WhenStep } from "@/components/reservation/when-step";
import type { QuadPageData } from "@/lib/data/public-types";
import { RESERVATION_DAYS, type When } from "@/lib/reservation";
import { dateKey, nextDays } from "@/lib/sauna";
import { QuadPreviewReview } from "./quad-preview-review";
import { quadPreviewPlan, quadPreviewStarts, type QuadPreviewPick } from "./quad-preview-plan";
import { QuadTourCard } from "./quad-tour-card";

/** Explicitly isolated visual preview. Supplier prices never reach the booking actions. */
export function QuadBookingPreview({ data }: { data: QuadPageData }) {
  const days = useMemo(() => nextDays(data.today, RESERVATION_DAYS), [data.today]);
  const [date, setDate] = useState(days[0]);
  const [pick, setPick] = useState<QuadPreviewPick | null>(null);
  const [review, setReview] = useState(false);
  const day = dateKey(date);
  const when: When = { day, people: 1 };
  const plan = quadPreviewPlan(data, when, pick);
  const lines = plan ? [plan.line] : [];
  const quantities: PlanQuantities = {};
  if (pick && plan && plan.maxUnits > 0) {
    quantities.keturraciai = [{
      id: "tour",
      label: "Keturračių kiekis",
      value: pick.units,
      max: plan.maxUnits,
      onChange: (units) => setPick((current) => current ? { ...current, units } : current),
    }];
  }
  const details = {
    lines,
    total: plan?.line.price ?? 0,
    quantities,
    busy: false,
    onRemove: () => setPick(null),
  };
  const continueAction = { disabled: !plan?.ok, onClick: () => setReview(true) };

  return (
    <>
      <div id="trasos" className="scroll-mt-32 grid gap-10 lg:grid-cols-3 lg:gap-12">
        <div className="min-w-0 space-y-8 lg:col-span-2">
          <section aria-label="Pasirink turo dieną" className="space-y-3">
            <h2 className="text-heading font-bold">Kada susitinkam?</h2>
            <WhenStep
              days={days}
              date={date}
              onDate={(next) => {
                if (dateKey(next) !== day) setPick(null);
                setDate(next);
              }}
              icons={(candidate) => {
                const open = quadPreviewStarts(data, dateKey(candidate), 1).length > 0;
                return [{ Icon: ArrowUpRightIcon, label: open ? "Yra laisvų keturračių" : "Laisvų keturračių nėra", on: open }];
              }}
            />
          </section>
          <QuadTourCard key={day} data={data} when={when} busy={[]} pick={pick} onChange={setPick} />
        </div>
        <PlanPanel activity="keturraciai" continueAction={continueAction} {...details} />
      </div>
      <MobilePlanDock activity="keturraciai" whenLabel={plan?.line.title ?? "Pasirink dieną ir turą"} continueAction={continueAction} {...details} />
      <QuadPreviewReview open={review} onClose={() => setReview(false)} lines={lines} total={details.total} />
    </>
  );
}
