import type { Metadata } from "next";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import { ReservationFlow } from "@/components/reservation/reservation-flow";
import { ACTIVITY_ORDER, RESERVATION_DAYS } from "@/lib/reservation";
import { getCabinPageData, getQuadPageData, getSaunaPageData } from "@/lib/data/public";
import { getCustomer } from "@/lib/customer";
import { paymentsEnabled } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Rezervacija - Vanduo Marse",
  description: "Pasirink dieną, laiką ir žmonių skaičių, tada pirtį, keturračius ir nakvynę vienoje užklausoje. Patvirtinsime telefonu ar el. paštu.",
};

const PARK_PHOTO = {
  src: "/landing/aerial.webp",
  alt: "Vanduo Marse parkas iš oro: ežeras, vandenlenčių trasa ir nameliai",
};

/** One request for the whole visit: day and group first, then any mix of sauna, stay and quads. */
export default async function ReservationPage({ searchParams }: { searchParams: Promise<{ veikla?: string }> }) {
  const { veikla } = await searchParams;
  const initialTab = ACTIVITY_ORDER.find((id) => id === veikla);
  const availabilityWindow = { days: RESERVATION_DAYS, now: new Date() };
  const [sauna, cabin, quads, customer] = await Promise.all([
    getSaunaPageData(availabilityWindow),
    getCabinPageData(availabilityWindow),
    getQuadPageData(availabilityWindow),
    getCustomer(),
  ]);

  const header = <BookingHeader crumb="Rezervacija" title={["Rezervacija"]} />;

  return (
    <BookingPage>
      <div className="theme-reservation">
        <ReservationFlow
          header={header}
          data={{ sauna, cabin, quads }}
          photo={PARK_PHOTO}
          initialTab={initialTab}
          payments={paymentsEnabled()}
          initialCustomer={customer}
        />
      </div>
    </BookingPage>
  );
}
