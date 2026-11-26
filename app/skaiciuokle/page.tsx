import type { Metadata } from "next";
import { connection } from "next/server";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import { CalculatorPage } from "@/components/calculator/calculator-page";
import { getCabinPageData, getCalculatorCatalog } from "@/lib/data/public";
import { MAX_STAY_NIGHTS, STAY_BOOKING_DAYS } from "@/lib/cabin";
import { dateKey, nextDays, todayKey } from "@/lib/sauna";
import { EVENTS_OG_IMAGE, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Renginio kainos skaičiuoklė",
  description: "Apskaičiuokite preliminarią vestuvių, gimtadienio, įmonės renginio ar konferencijos kainą Vanduo Marse parke prie Kauno per kelias minutes.",
  path: "/skaiciuokle",
  image: EVENTS_OG_IMAGE,
});

export default async function SkaiciuoklePage() {
  await connection();
  const [catalog, cabin] = await Promise.all([getCalculatorCatalog(), getCabinPageData({ now: new Date() })]);
  return (
    <BookingPage>
      <div className="theme-reservation px-gutter pb-32 pt-10 md:pt-14 lg:pb-20">
        <CalculatorPage
          today={todayKey()}
          catalog={catalog}
          stay={{ availability: cabin.availability, through: dateKey(nextDays(cabin.today, STAY_BOOKING_DAYS + MAX_STAY_NIGHTS + 1).at(-1)!) }}
          header={
            <BookingHeader
              crumb="Skaičiuoklė"
              title={["Skaičiuoklė"]}
            />
          }
        />
      </div>
    </BookingPage>
  );
}
