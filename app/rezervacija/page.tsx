import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import { ReservationFlow } from "@/components/reservation/reservation-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { ACTIVITY_ORDER, RESERVATION_DAYS } from "@/lib/reservation";
import { getCabinPageData, getQuadPageData, getSaunaPageData, getWakeOffers } from "@/lib/data/public";
import { getCustomer } from "@/lib/customer";
import { paymentsEnabled } from "@/lib/stripe";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Rezervacija: pirtis, nakvynė ir keturračiai",
  description: "Pasirink dieną, laiką ir žmonių skaičių, tada pirtį, keturračius ir nakvynę Kauno rajone vienoje užklausoje. Patvirtinsime telefonu ar el. paštu.",
  path: "/rezervacija",
});

type SearchParams = Promise<{ veikla?: string; seansas?: string | string[] }>;

const header = <BookingHeader crumb="Rezervacija" title={["Rezervacija"]} />;

/** One request for the whole visit: day and group first, then any mix of sauna, stay and quads. */
export default function ReservationPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <BookingPage>
      <div className="theme-reservation">
        <Suspense fallback={<ReservationFallback />}>
          <ReservationContent searchParams={searchParams} />
        </Suspense>
      </div>
    </BookingPage>
  );
}

/** Header and a placeholder while the availability queries run; same padding and grid as `ReservationFlow`, so nothing jumps when it arrives. */
function ReservationFallback() {
  return (
    <div className="px-gutter pt-10 pb-16 md:pt-14 md:pb-24">
      <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
        <div className="min-w-0 space-y-8 lg:col-span-2">
          {header}
          <Skeleton className="h-96 w-full rounded-none" />
        </div>
        <Skeleton className="hidden h-96 rounded-none lg:block" />
      </div>
    </div>
  );
}

async function ReservationContent({ searchParams }: { searchParams: SearchParams }) {
  const { veikla, seansas } = await searchParams;
  const sessionId = Array.isArray(seansas) ? seansas[0] : seansas;
  const initialTab = sessionId ? "pirtis" : veikla === "wake" ? "wake" : ACTIVITY_ORDER.find((id) => id === veikla);
  const availabilityWindow = { days: RESERVATION_DAYS, now: new Date() };
  const [sauna, cabin, quads, customer, wakeOffers] = await Promise.all([
    getSaunaPageData(availabilityWindow),
    getCabinPageData(availabilityWindow),
    getQuadPageData(availabilityWindow),
    getCustomer(),
    getWakeOffers(),
  ]);

  return (
    <ReservationFlow
      header={header}
      data={{ sauna, cabin, quads }}
      initialTab={initialTab}
      wakeProducts={wakeOffers}
      initialDay={sauna.events.find((event) => event.key === sessionId)?.date}
      payments={paymentsEnabled()}
      initialCustomer={customer}
    />
  );
}
