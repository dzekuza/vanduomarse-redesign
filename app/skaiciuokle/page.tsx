import type { Metadata } from "next";
import { connection } from "next/server";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import { EventCalculator } from "@/components/calculator/event-calculator";
import { getCalculatorCatalog } from "@/lib/data/public";
import { todayKey } from "@/lib/sauna";

export const metadata: Metadata = {
  title: "Renginio kainos skaičiuoklė - Vanduo Marse",
  description: "Apskaičiuokite preliminarią vestuvių, gimtadienio, įmonės renginio ar konferencijos kainą Vanduo Marse parke.",
};

export default async function SkaiciuoklePage() {
  await connection();
  const catalog = await getCalculatorCatalog();
  return (
    <BookingPage>
      <div className="theme-reservation px-gutter pb-32 pt-10 md:pt-14 lg:pb-20">
        <EventCalculator
          today={todayKey()}
          catalog={catalog}
          header={
            <BookingHeader
              crumb="Skaičiuoklė"
              title={["Suskaičiuok", "savo šventę."]}
              intro="Pasirink renginio tipą, svečių skaičių ir erdvę. Preliminarią kainą matysi iškart."
            />
          }
        />
      </div>
    </BookingPage>
  );
}
