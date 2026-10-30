import type { Metadata } from "next";
import { BookingHero } from "@/components/booking/booking-hero";
import { BookingPage } from "@/components/booking/booking-page";
import { PhoneGate } from "@/components/booking/phone-gate";
import { CabinBooking } from "@/components/booking/cabin-booking";
import { CABIN_DAYS, getCabinPageData } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Miegas Marse - rezervacija",
};

const FACTS = [
  { label: "Vieta", value: "Prie pat trasos" },
  { label: "Tipai", value: "Namelis arba kemperis" },
  { label: "Svečiai", value: "Nameliai 2 arba 4 asmenims" },
  { label: "Atsiskaitymas", value: "Iš anksto" },
];

export default async function MiegasPage() {
  const data = await getCabinPageData();

  return (
    <BookingPage>
      <BookingHero
        eyebrow="Miegas Marse"
        title={["Plauk ir", "gyvenk parke."]}
        intro="Namelis ar kemperio aikštelė prie pat ežero. Pirmas rytinis seansas prasideda dar prieš pusryčius."
        facts={FACTS}
        gallery={[{ src: "https://picsum.photos/seed/lakeside-wooden-cabin-campsite-dusk/1600/600", alt: "Namelis prie ežero" }]}
      >
        <PhoneGate>
          <CabinBooking data={data} days={CABIN_DAYS} />
        </PhoneGate>
      </BookingHero>
    </BookingPage>
  );
}
