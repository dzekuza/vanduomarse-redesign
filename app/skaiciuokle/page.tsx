import type { Metadata } from "next";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import { EventCalculator } from "@/components/calculator/event-calculator";

export const metadata: Metadata = {
  title: "Renginio kainos skaičiuoklė - Vanduo Marse",
  description: "Apskaičiuokite preliminarią vestuvių, gimtadienio, įmonės renginio ar konferencijos kainą Vanduo Marse parke.",
};

export default function SkaiciuoklePage() {
  return (
    <BookingPage>
      <div className="theme-reservation px-gutter pb-32 pt-10 md:pt-14 lg:pb-20">
        <EventCalculator
          header={
            <BookingHeader
              crumb="Skaičiuoklė"
              title={["Suskaičiuok", "savo šventę."]}
              intro="Pasirink renginio tipą, svečių skaičių ir erdvę – iškart matysi preliminarią kainą pagal mūsų kainodarą."
            />
          }
        />
      </div>
    </BookingPage>
  );
}
