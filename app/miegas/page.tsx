import type { Metadata } from "next";
import { BookingHero } from "@/components/booking/booking-hero";
import { BookingPage } from "@/components/booking/booking-page";
import { CabinBooking } from "@/components/booking/cabin-booking";

export const metadata: Metadata = {
  title: "Miegas Marse - rezervacija",
};

const FACTS = [
  { label: "Vieta", value: "Prie pat trasos" },
  { label: "Tipai", value: "Namelis arba kemperis" },
  { label: "Svečiai", value: "Iki 6 vienam nameliui" },
  { label: "Atsiskaitymas", value: "Iš anksto" },
];

export default function MiegasPage() {
  return (
    <BookingPage>
      <BookingHero
        eyebrow="Miegas Marse"
        title={["Plauk ir", "gyvenk parke."]}
        intro="Namelis ar kemperio aikštelė prie pat ežero. Pirmas rytinis seansas prasideda dar prieš pusryčius."
        facts={FACTS}
        gallery={[{ src: "https://picsum.photos/seed/lakeside-wooden-cabin-campsite-dusk/1600/600", alt: "Namelis prie ežero" }]}
      >
        <CabinBooking />
      </BookingHero>
    </BookingPage>
  );
}
