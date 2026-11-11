import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import { ReservationFlow } from "@/components/reservation/reservation-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { ACTIVITY_ORDER, RESERVATION_DAYS } from "@/lib/reservation";
import { getCabinPageData, getCouponProducts, getQuadPageData, getSaunaPageData } from "@/lib/data/public";
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

/** Header and a placeholder while the availability queries run, so the page shell is not blocked on them. */
function ReservationFallback() {
  return (
    <>
      {header}
      <Skeleton className="mx-auto mt-6 h-96 w-full max-w-6xl" />
    </>
  );
}

async function ReservationContent({ searchParams }: { searchParams: SearchParams }) {
  const { veikla, seansas } = await searchParams;
  const sessionId = Array.isArray(seansas) ? seansas[0] : seansas;
  const initialTab = sessionId ? "pirtis" : veikla === "wake" ? "wake" : ACTIVITY_ORDER.find((id) => id === veikla);
  const availabilityWindow = { days: RESERVATION_DAYS, now: new Date() };
  const [sauna, cabin, quads, customer, products] = await Promise.all([
    getSaunaPageData(availabilityWindow),
    getCabinPageData(availabilityWindow),
    getQuadPageData(availabilityWindow),
    getCustomer(),
    getCouponProducts(),
  ]);

  return (
    <ReservationFlow
      header={header}
      data={{ sauna, cabin, quads }}
      initialTab={initialTab}
      wakeProducts={products.filter(({ service }) => service === "kabelis")}
      initialDay={sauna.events.find((event) => event.key === sessionId)?.date}
      payments={paymentsEnabled()}
      initialCustomer={customer}
    />
  );
}
