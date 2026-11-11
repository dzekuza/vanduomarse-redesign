import { ClockCounterClockwiseIcon } from "@phosphor-icons/react";
import { useRef, type Ref } from "react";
import type { ServicePhoto } from "@/components/landing/content";
import { ServiceGallery } from "@/components/landing/service-gallery";
import { ServiceBookingHelp } from "@/components/services/service-booking-help";
import { EVENTS_EMAIL, MAIN_CONTACT, RESERVATION_PHONE } from "@/lib/contacts";
import { formatEuro } from "@/lib/coupons";
import { ACTIVITY_TITLE, type ActivityId } from "@/lib/reservation";
import type { HireBandPrices } from "@/lib/sauna-hire";
import { PlanLines, type PlanLinesProps } from "./plan-lines";
import { PlanActions, type PlanContinueAction } from "./plan-actions";
import { activityPhotos } from "./activity-photos";

export type { PlanContinueAction } from "./plan-actions";

export interface PlanDetailsProps extends PlanLinesProps {
  total: number;
  preliminaryTotal?: HireBandPrices;
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
  if (inline) {
    const sauna = activity === "pirtis";
    const { total, preliminaryTotal } = details;
    return (
      <section ref={ref} tabIndex={-1} aria-label="Rezervacijos veiksmai" className="scroll-mt-32 border-t border-line pt-4">
        <div className="space-y-4">
          <div aria-live="polite" aria-atomic="true" className="empty:hidden">
            {preliminaryTotal ? (
              <>
                <p className="text-micro uppercase text-copy">Iš viso, su PVM</p>
                <PlanBandTotals prices={preliminaryTotal} />
              </>
            ) : total > 0 || (details.lines.length > 0 && !continueAction?.disabled) ? (
              <p className="flex items-baseline justify-between gap-3">
                <span className="text-xs text-copy">Iš viso, su PVM</span>
                <strong className="text-figure">{formatEuro(total)}</strong>
              </p>
            ) : null}
          </div>
          {sauna ? (
            <p className="flex items-start gap-3 text-xs text-copy"><ClockCounterClockwiseIcon size={18} aria-hidden className="shrink-0" /> Nemokamas atšaukimas likus bent 24 val. iki pradžios.</p>
          ) : null}
          {continueAction ? <PlanActions continueAction={continueAction} secondaryAction={secondaryAction} /> : null}
        </div>
        <ServiceBookingHelp contact={{ phone: RESERVATION_PHONE, email: sauna ? EVENTS_EMAIL : MAIN_CONTACT.email }} />
      </section>
    );
  }

  return (
    <aside aria-label="Rezervuoti" className="hidden border border-line bg-foam/15 lg:sticky lg:top-32 lg:block lg:max-h-[calc(100dvh-9rem)] lg:self-start lg:overflow-y-auto">
      <ServiceGallery key={`${activity}:${photos.map(({ src }) => src).join("|")}`} photos={photos} variant="panel" label={`${ACTIVITY_TITLE[activity]}: nuotraukos`} />
      <div className="p-5 sm:p-8">
        <div className="space-y-6">
          <h2 className="text-tile font-bold">Rezervuoti</h2>
          <PlanDetails {...details} />
          {continueAction ? <PlanActions continueAction={continueAction} secondaryAction={secondaryAction} /> : null}
        </div>
        <ServiceBookingHelp contact={{ phone: RESERVATION_PHONE, email: MAIN_CONTACT.email }} />
      </div>
    </aside>
  );
}

/** The live plan shown in both the desktop panel and the mobile summary sheet. */
export function PlanDetails({ lines, total, preliminaryTotal, quantities, saunaTime, busy, onRemove }: PlanDetailsProps) {
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
          {preliminaryTotal ? <PlanBandTotals prices={preliminaryTotal} /> : <p className="font-display text-total font-bold">{total} €</p>}
        </div>
        <p className="mt-1 text-xs text-copy">Preliminari kaina. Galutinę ir laisvas vietas patvirtinsime.</p>
      </div>
    </>
  );
}

function PlanBandTotals({ prices }: { prices: HireBandPrices }) {
  return (
    <>
      <dl className="mt-2 grid grid-cols-2 gap-3">
        <div>
          <dt className="text-xs text-copy">I–IV</dt>
          <dd className="font-display text-heading font-bold">{formatEuro(prices.weekday)}</dd>
        </div>
        <div>
          <dt className="text-xs text-copy">V–VII</dt>
          <dd className="font-display text-heading font-bold">{formatEuro(prices.weekend)}</dd>
        </div>
      </dl>
      <p className="mt-1 text-xs text-copy">Preliminari suma iki datos pasirinkimo.</p>
    </>
  );
}
