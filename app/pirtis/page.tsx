import type { Metadata } from "next";
import { BookingHero } from "@/components/booking/booking-hero";
import { BookingPage } from "@/components/booking/booking-page";
import { SaunaBooking } from "@/components/booking/sauna-booking";

export const metadata: Metadata = {
  title: "Pirtis Marse - rezervacija",
};

const FACTS = [
  { label: "Vieta", value: "Prie pat ežero kranto" },
  { label: "Talpa", value: "Iki 8 žmonių" },
  { label: "Trukmė", value: "90 min seansas" },
  { label: "Kūrenimas", value: "Malkomis, iš anksto" },
];

export default function PirtisPage() {
  return (
    <BookingPage>
      <BookingHero
        eyebrow="Pirtis Marse"
        title={["Karšta pirtis.", "Šaltas ežeras."]}
        intro="Malkomis kūrenama pirtis prie pat vandens. Išeini iš garų tiesiai į ežerą. Rezervuojama visai grupei, ne vietoms."
        facts={FACTS}
        image={{
          src: "https://picsum.photos/seed/lakeside-wood-sauna-steam-nordic/1600/600",
          alt: "Malkomis kūrenama pirtis prie ežero",
        }}
      >
        <SaunaBooking />
      </BookingHero>
    </BookingPage>
  );
}
