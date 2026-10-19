import type { Metadata } from "next";
import { BookingPage } from "@/components/booking/booking-page";
import { EventCalculator } from "@/components/calculator/event-calculator";

export const metadata: Metadata = {
  title: "Renginio kainos skaičiuoklė - Vanduo Marse",
  description: "Apskaičiuokite preliminarią vestuvių, gimtadienio, įmonės renginio ar konferencijos kainą Vanduo Marse parke.",
};

export default function SkaiciuoklePage() {
  return (
    <BookingPage>
      <section className="px-6 pb-32 pt-6 md:px-10 md:pt-10 lg:pb-20">
        <div className="max-w-3xl">
          <p className="mb-6 inline-block border border-ink px-4 py-2 text-xs uppercase">Renginių kainodara 2026–2027</p>
          <h1 className="font-display text-4xl font-bold leading-[1.02] sm:text-5xl xl:text-6xl">
            Suskaičiuok
            <br />
            savo šventę.
          </h1>
          <p className="mt-6 max-w-md text-ink/80">
            Pasirink renginio tipą, svečių skaičių ir erdvę – iškart matysi preliminarią kainą pagal mūsų kainodarą.
          </p>
        </div>
        <div className="mt-12">
          <EventCalculator />
        </div>
      </section>
    </BookingPage>
  );
}
