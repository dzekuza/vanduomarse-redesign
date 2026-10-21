import type { Metadata } from "next";
import { BookingHero } from "@/components/booking/booking-hero";
import { BookingPage } from "@/components/booking/booking-page";
import { SaunaReservation } from "@/components/booking/sauna-reservation";
import { SAUNA_DAYS, getSaunaPageData } from "@/lib/data/public";
import type { SaunaRates } from "@/lib/sauna";

export const metadata: Metadata = {
  title: "Pirtis Marse - rezervacija",
};

/** Capacity and price follow the live rates from /admin/pirtis. */
const facts = (rates: SaunaRates) => [
  { label: "Vieta", value: "Prie pat ežero kranto" },
  { label: "Talpa", value: `Iki ${rates.maxParty} žmonių` },
  { label: "Kaina", value: `Nuo ${rates.smallGroupRate} €/val., min. ${rates.minHours} val.` },
  { label: "Kūrenimas", value: "Malkomis, iš anksto" },
];

// Unsplash (free licence) stand-ins until the client supplies Pirtis Marse photos.
const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=75`;

const GALLERY = [
  { src: unsplash("1788515917792-790e6b1d9af5"), alt: "Statinės formos pirtis ant ežero kranto saulėlydžio metu" },
  { src: unsplash("1728404259075-209cfb5bb89c"), alt: "Malkomis kūrenama krosnis medinėje pirtyje" },
  { src: unsplash("1565357938981-b9201b389eaa"), alt: "Beržinės vantos ant lieptelio prie ežero" },
  { src: unsplash("1676452457948-7d02dff1eb43"), alt: "Vandens pylimas ant įkaitusių akmenų" },
  { src: unsplash("1786800005702-5d65229a3e5c"), alt: "Medinės pirties vidus su gultais ir kibirėliu" },
];

/** `?skirtukas=renginiai` opens the public-events tab (linked from /renginiai). */
export default async function PirtisPage({ searchParams }: PageProps<"/pirtis">) {
  const [{ skirtukas }, data] = await Promise.all([searchParams, getSaunaPageData()]);

  return (
    <BookingPage>
      <BookingHero
        eyebrow="Pirtis Marse"
        title={["Karšta pirtis.", "Šaltas ežeras."]}
        intro="Malkomis kūrenama pirtis prie pat vandens. Išeini iš garų tiesiai į ežerą. Rezervuojama visai grupei, ne vietoms."
        facts={facts(data.rates)}
        gallery={GALLERY}
      >
        <SaunaReservation initialMode={skirtukas === "renginiai" ? "event" : "private"} data={data} days={SAUNA_DAYS} />
      </BookingHero>
    </BookingPage>
  );
}
