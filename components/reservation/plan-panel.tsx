import Image from "next/image";
import { useRef } from "react";
import { SERVICES, type Service } from "@/components/landing/content";
import { PhoneHelp } from "@/components/phone-help";
import type { ActivityId } from "@/lib/reservation";
import { PlanLines, type PlanLinesProps } from "./plan-lines";
import { PlanActions, type PlanContinueAction } from "./plan-actions";

export type { PlanContinueAction } from "./plan-actions";

export const PLAN_ACTIVITY_PHOTOS: Record<ActivityId, Pick<Service, "photo" | "alt">> = {
  pirtis: SERVICES.sauna,
  nakvyne: SERVICES.cabins,
  keturraciai: SERVICES.ciongo,
};

export interface PlanDetailsProps extends PlanLinesProps {
  total: number;
}

interface PlanPanelProps extends PlanDetailsProps {
  activity: ActivityId;
  continueAction?: PlanContinueAction;
  secondaryAction?: PlanContinueAction;
}

/** Side panel that follows the visitor: photo, "Tavo pasirinkimas" and the running total. */
export function PlanPanel({ activity, continueAction, secondaryAction, ...details }: PlanPanelProps) {
  const { photo, alt } = PLAN_ACTIVITY_PHOTOS[activity];

  return (
    <aside aria-label="Tavo pasirinkimas" className="hidden border border-line bg-foam/15 lg:sticky lg:top-32 lg:block lg:max-h-[calc(100dvh-9rem)] lg:self-start lg:overflow-y-auto">
      <div className="relative aspect-video max-h-48 w-full bg-dust-soft">
        <Image src={photo} alt={alt} fill sizes="33vw" className="object-cover" />
        <span className="absolute bottom-0 left-4 bg-dust px-3 py-2 text-micro uppercase">Tavo planas Marse</span>
      </div>
      <div className="space-y-6 p-5 sm:p-8">
        <h2 className="text-tile font-bold">Tavo pasirinkimas</h2>
        <PlanDetails {...details} />
        {continueAction ? <PlanActions continueAction={continueAction} secondaryAction={secondaryAction} /> : null}
      </div>
    </aside>
  );
}

/** The live plan shown in both the desktop panel and the mobile summary sheet. */
export function PlanDetails({ lines, total, quantities, saunaTime, busy, onRemove }: PlanDetailsProps) {
  const totalRef = useRef<HTMLParagraphElement>(null);

  return (
    <>
      <PlanLines lines={lines} quantities={quantities} saunaTime={saunaTime} busy={busy} onRemove={(activity) => {
        totalRef.current?.focus({ preventScroll: true });
        onRemove(activity);
      }} />
      <div className="border-t border-line pt-4">
        <p ref={totalRef} tabIndex={-1} className="text-micro uppercase text-copy">Iš viso, su PVM</p>
        <p aria-live="polite" className="font-display text-total font-bold">{total} €</p>
        <p className="mt-1 text-xs text-copy">Preliminari kaina. Galutinę ir laisvas vietas patvirtinsime.</p>
      </div>
      <PhoneHelp />
    </>
  );
}
