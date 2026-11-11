import { ClockCounterClockwiseIcon } from "@phosphor-icons/react";
import { useRef, type Ref } from "react";
import type { ServicePhoto } from "@/components/landing/content";
import { ServiceGallery } from "@/components/landing/service-gallery";
import { ServiceBookingHelp } from "@/components/services/service-booking-help";
import { MAIN_CONTACT, RESERVATION_PHONE } from "@/lib/contacts";
import { ACTIVITY_TITLE, type ActivityId } from "@/lib/reservation";
import { PlanLines, type PlanLinesProps } from "./plan-lines";
import { PlanActions, type PlanContinueAction } from "./plan-actions";
import { activityPhotos } from "./activity-photos";

export type { PlanContinueAction } from "./plan-actions";

export interface PlanDetailsProps extends PlanLinesProps {
  total: number;
  saunaCancellation?: boolean;
  /** Hide the "Reikalinga pagalba?" block: the quad service page shows its own beside the plan. */
  hideHelp?: boolean;
}

interface PlanPanelProps extends PlanDetailsProps {
  activity: ActivityId;
  photos?: ServicePhoto[];
  inline?: boolean;
  ref?: Ref<HTMLElement>;
  continueAction?: PlanContinueAction;
  secondaryAction?: PlanContinueAction;
}

/** Side panel that follows the visitor: activity photos and the running reservation total. */
export function PlanPanel({ activity, photos = activityPhotos(activity), inline, ref, continueAction, secondaryAction, ...details }: PlanPanelProps) {
  return (
    <aside ref={ref} tabIndex={inline ? -1 : undefined} aria-label={inline ? "Rezervacijos planas" : "Rezervuoti"} className={inline ? "scroll-mt-32 border-t border-line" : "hidden border border-line bg-foam/15 lg:sticky lg:top-32 lg:block lg:max-h-[calc(100dvh-9rem)] lg:self-start lg:overflow-y-auto"}>
      {inline ? null : <ServiceGallery key={`${activity}:${photos.map(({ src }) => src).join("|")}`} photos={photos} variant="panel" label={`${ACTIVITY_TITLE[activity]}: nuotraukos`} />}
      <div className={inline ? "space-y-4 pt-4" : "space-y-6 p-5 sm:p-8"}>
        <h2 className={inline ? "text-item font-bold" : "text-tile font-bold"}>{inline ? "Tavo planas" : "Rezervuoti"}</h2>
        <PlanDetails {...details} saunaCancellation={inline && activity === "pirtis"} hideHelp={inline && activity === "keturraciai"} />
        {continueAction ? <PlanActions continueAction={continueAction} secondaryAction={secondaryAction} /> : null}
      </div>
    </aside>
  );
}

/** The live plan shown in both the desktop panel and the mobile summary sheet. */
export function PlanDetails({ lines, total, quantities, saunaTime, busy, onRemove, saunaCancellation, hideHelp }: PlanDetailsProps) {
  const totalRef = useRef<HTMLParagraphElement>(null);

  return (
    <>
      <PlanLines lines={lines} quantities={quantities} saunaTime={saunaTime} busy={busy} onRemove={(activity) => {
        totalRef.current?.focus({ preventScroll: true });
        onRemove(activity);
      }} />
      <div className="border-t border-line pt-4">
        <p ref={totalRef} tabIndex={-1} className="text-micro uppercase text-copy">Iš viso, su PVM</p>
        <div aria-live="polite" aria-atomic="true">
          <p className="font-display text-total font-bold">{total} €</p>
        </div>
        {saunaCancellation ? (
          <p className="mt-1 flex items-center gap-2 text-xs text-copy"><ClockCounterClockwiseIcon size={16} aria-hidden className="shrink-0" /> Nemokamas atšaukimas likus bent 24 val. iki pirties pradžios.</p>
        ) : <p className="mt-1 text-xs text-copy">Preliminari kaina. Galutinę ir laisvas vietas patvirtinsime.</p>}
      </div>
      {hideHelp ? null : <ServiceBookingHelp contact={{ ...MAIN_CONTACT, phone: RESERVATION_PHONE }} />}
    </>
  );
}
