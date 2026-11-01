import type { Metadata } from "next";
import { BookingPage } from "@/components/booking/booking-page";
import { PageIntro } from "@/components/page-intro";
import { EventCalculator } from "@/components/calculator/event-calculator";

export const metadata: Metadata = {
  title: "Renginio kainos skaičiuoklė - Vanduo Marse",
  description: "Apskaičiuokite preliminarią vestuvių, gimtadienio, įmonės renginio ar konferencijos kainą Vanduo Marse parke.",
};

export default function SkaiciuoklePage() {
  return (
    <BookingPage>
      <PageIntro
        eyebrow="Renginių kainodara 2026–2027"
        title={["Suskaičiuok", "savo šventę."]}
        intro="Pasirink renginio tipą, svečių skaičių ir erdvę – iškart matysi preliminarią kainą pagal mūsų kainodarą."
      />
      <section className="px-gutter pb-32 pt-12 md:pt-16 lg:pb-20">
        <EventCalculator />
      </section>
    </BookingPage>
  );
}
