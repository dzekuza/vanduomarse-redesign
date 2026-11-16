import { ClockCounterClockwiseIcon } from "@phosphor-icons/react";
import { useRef, type Ref } from "react";
import { BookingPanel } from "@/components/booking/booking-panel";
import { BookingPrice } from "@/components/booking/booking-price";
import type { ServicePhoto } from "@/components/landing/content";
import { ServiceBookingHelp } from "@/components/services/service-booking-help";
import { EVENTS_EMAIL, MAIN_CONTACT, RESERVATION_PHONE } from "@/lib/contacts";
import { ACTIVITY_TITLE, type ActivityId } from "@/lib/reservation";
import { formatEuro } from "@/lib/coupons";
import { PlanLines, type PlanLinesProps } from "./plan-lines";
import { PlanActions, type PlanContinueAction } from "./plan-actions";
import { activityPhotos } from "./activity-photos";

export type { PlanContinueAction } from "./plan-actions";

export interface PlanDetailsProps extends PlanLinesProps {
  total: number;
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
  const saunaSidebar = inline && activity === "pirtis";
  const quadSidebar = inline && activity === "keturraciai";
  const saunaOnly = activity === "pirtis" && details.lines.length === 1 && details.lines[0].id === "pirtis";
  const showDetails = !inline || details.lines.length > 0 || activity === "keturraciai";

  const contents = (
    <>
      {showDetails ? <PlanDetails {...details} showLines={!saunaSidebar && !saunaOnly} /> : null}
      {saunaSidebar ? (
        <p className="flex items-center gap-2 text-xs leading-relaxed text-copy">
          <ClockCounterClockwiseIcon size={16} aria-hidden className="shrink-0" />
          Nemokamas atšaukimas likus bent 24 val. iki pradžios.
        </p>
      ) : null}
      {continueAction ? <PlanActions continueAction={continueAction} secondaryAction={secondaryAction} /> : null}
      {quadSidebar ? null : <ServiceBookingHelp contact={{ phone: RESERVATION_PHONE, email: saunaSidebar ? EVENTS_EMAIL : MAIN_CONTACT.email }} />}
    </>
  );

  if (inline) {
    return (
      <aside ref={ref} tabIndex={-1} aria-label="Rezervacijos planas" className={`scroll-mt-32 ${quadSidebar ? "" : "border-t border-line"}`}>
        <div className={`space-y-4 ${quadSidebar ? "" : "pt-4"}`}>{contents}</div>
      </aside>
    );
  }

  return (
    <BookingPanel
      ref={ref}
      title="Rezervuoti"
      photos={photos}
      photoLabel={`${ACTIVITY_TITLE[activity]}: nuotraukos`}
      galleryKey={`${activity}:${photos.map(({ src }) => src).join("|")}`}
    >
      {contents}
    </BookingPanel>
  );
}

/** The live plan shown in both the desktop panel and the mobile summary sheet. */
export function PlanDetails({ lines, total, quantities, saunaTime, busy, onRemove, showLines = true }: PlanDetailsProps & { showLines?: boolean }) {
  const totalRef = useRef<HTMLParagraphElement>(null);

  return (
    <>
      {showLines ? (
        <PlanLines lines={lines} quantities={quantities} saunaTime={saunaTime} busy={busy} onRemove={(activity) => {
          totalRef.current?.focus({ preventScroll: true });
          onRemove(activity);
        }} />
      ) : null}
      <div className={showLines ? "border-t border-line pt-4" : undefined}>
        <BookingPrice
          amount={formatEuro(total)}
          labelRef={totalRef}
          label={showLines ? undefined : "Galutinė kaina, su PVM"}
          note={showLines ? "Preliminari kaina. Galutinę ir laisvas vietas patvirtinsime." : undefined}
        />
      </div>
    </>
  );
}
