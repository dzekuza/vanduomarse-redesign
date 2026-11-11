import type { Metadata } from "next";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import type { ReservationTab } from "@/components/reservation/activity-tabs";
import { ReservationFlow } from "@/components/reservation/reservation-flow";
import { RESERVATION_DAYS } from "@/lib/reservation";
import { getCabinPageData, getCouponProducts, getQuadPageData, getSaunaPageData } from "@/lib/data/public";
import { getCustomer } from "@/lib/customer";
import { paymentsEnabled } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Rezervacija - Vanduo Marse",
  description: "Rezervuok pirties seansą, privačią pirtį, nakvynę ar keturračių turą. Rinkis WAKE plaukimą arba sezono abonementą.",
};

/** One request for the whole visit: day and group first, then any mix of sauna, stay and quads. */
export default async function ReservationPage({ searchParams }: { searchParams: Promise<{ veikla?: string; seansas?: string | string[] }> }) {
  const { veikla, seansas } = await searchParams;
  const sessionId = Array.isArray(seansas) ? seansas[0] : seansas;
  const initialTab: ReservationTab = sessionId ? "session"
    : veikla === "pirtis" || veikla === "private" ? "private"
      : veikla === "nakvyne" || veikla === "keturraciai" || veikla === "wake" ? veikla : "session";
  const availabilityWindow = { days: RESERVATION_DAYS, now: new Date() };
  const [sauna, cabin, quads, customer, products] = await Promise.all([
    getSaunaPageData(availabilityWindow),
    getCabinPageData(availabilityWindow),
    getQuadPageData(availabilityWindow),
    getCustomer(),
    getCouponProducts(),
  ]);

  const header = <BookingHeader crumb="Rezervacija" title={["Rezervacija"]} />;

  return (
    <BookingPage>
      <div className="theme-reservation">
        <ReservationFlow
          header={header}
          data={{ sauna, cabin, quads }}
          initialTab={initialTab}
          wakeProducts={products.filter(({ service }) => service === "kabelis")}
          initialDay={sauna.events.find((event) => event.key === sessionId)?.date}
          payments={paymentsEnabled()}
          initialCustomer={customer}
        />
      </div>
    </BookingPage>
  );
}
