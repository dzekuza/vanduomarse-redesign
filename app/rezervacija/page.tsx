import type { Metadata } from "next";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import { ReservationFlow } from "@/components/reservation/reservation-flow";
import { ReservationGate } from "@/components/reservation/reservation-gate";
import { getCabinPageData, getQuadPageData, getSaunaPageData } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Rezervacija - Vanduo Marse",
  description: "Pasirink dieną, laiką ir žmonių skaičių, tada pirtį, keturračius ir nakvynę vienoje užklausoje. Patvirtinsime telefonu ar el. paštu.",
};

// Unsplash (free licence) stand-in until the client supplies park photos.
const FALLBACK_PHOTO = {
  src: "https://images.unsplash.com/photo-1788515917792-790e6b1d9af5?auto=format&fit=crop&w=1800&q=90",
  alt: "Statinės formos pirtis ant ežero kranto saulėlydžio metu",
};

/** One request for the whole visit: day and group first, then any mix of sauna, stay and quads. */
export default async function ReservationPage() {
  const [sauna, cabin, quads] = await Promise.all([getSaunaPageData(), getCabinPageData(), getQuadPageData()]);
  const cover = sauna.saunas.flatMap((s) => s.photos.map((p) => ({ src: p.url, alt: s.name })))[0];

  const header = (
    <BookingHeader
      crumb="Rezervacija"
      kicker="Tavo laikas Marse"
      tagline="Mažiau derinimo. Daugiau patirties."
      title={["Rezervacija"]}
      intro="Pasirink dieną ir kiek jūsų, tada pirtį, nakvynę ar keturračius vienoje užklausoje. Mokėti dabar nereikia."
    />
  );

  return (
    <BookingPage>
      <div className="theme-reservation">
        <ReservationGate header={header}>
          <ReservationFlow header={header} data={{ sauna, cabin, quads }} photo={cover ?? FALLBACK_PHOTO} />
        </ReservationGate>
      </div>
    </BookingPage>
  );
}
