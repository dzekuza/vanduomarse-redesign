import type { Metadata } from "next";
import { BookingHero } from "@/components/booking/booking-hero";
import { BookingPage } from "@/components/booking/booking-page";
import { PhoneGate } from "@/components/booking/phone-gate";
import { SaunaReservation } from "@/components/booking/sauna-reservation";
import { SAUNA_DAYS, getSaunaPageData } from "@/lib/data/public";
import type { SaunaPageData } from "@/lib/data/public-types";
import { fromRate } from "@/lib/sauna";

export const metadata: Metadata = {
  title: "Pirtis Marse - rezervacija",
};

/** Capacity and price follow the live saunas from /admin/pirtis: the largest group and the lowest rate. */
function facts({ saunas }: SaunaPageData) {
  const rates = saunas.map((s) => s.rates);
  return [
    { label: "Vieta", value: "Prie pat ežero kranto" },
    ...(rates.length
      ? [
          { label: "Talpa", value: `Iki ${Math.max(...rates.map((r) => r.maxParty))} žmonių` },
          { label: "Kaina", value: `Nuo ${Math.min(...rates.map(fromRate))} €/val., min. ${Math.min(...rates.map((r) => r.minHours))} val.` },
        ]
      : []),
    { label: "Kūrenimas", value: "Malkomis, iš anksto" },
  ];
}

/** Uploaded sauna photos when there are any, otherwise the stand-ins. */
function gallery({ saunas }: SaunaPageData) {
  const photos = saunas.flatMap((s) => s.photos.map((p) => ({ src: p.url, alt: s.name })));
  return photos.length ? photos : GALLERY;
}

// Unsplash (free licence) stand-ins until the client supplies Pirtis Marse photos.
const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1800&q=90`;

const GALLERY = [
  { src: unsplash("1788515917792-790e6b1d9af5"), alt: "Statinės formos pirtis ant ežero kranto saulėlydžio metu" },
  { src: unsplash("1728404259075-209cfb5bb89c"), alt: "Malkomis kūrenama krosnis medinėje pirtyje" },
  { src: unsplash("1565357938981-b9201b389eaa"), alt: "Beržinės vantos ant lieptelio prie ežero" },
  { src: unsplash("1676452457948-7d02dff1eb43"), alt: "Vandens pylimas ant įkaitusių akmenų" },
  { src: unsplash("1786800005702-5d65229a3e5c"), alt: "Medinės pirties vidus su gultais ir kibirėliu" },
];

/** `?skirtukas=renginiai` opens the public-events tab (linked from /renginiai); `?pirtis=<id>` preselects a sauna. */
export default async function PirtisPage({ searchParams }: PageProps<"/pirtis">) {
  const [{ skirtukas, pirtis }, data] = await Promise.all([searchParams, getSaunaPageData()]);

  return (
    <BookingPage>
      <BookingHero
        eyebrow="Pirtis Marse"
        title={["Karšta pirtis.", "Šaltas ežeras."]}
        intro="Malkomis kūrenama pirtis prie pat vandens. Išeini iš garų tiesiai į ežerą. Rezervuojama visai grupei, ne vietoms."
        facts={facts(data)}
        gallery={gallery(data)}
      >
        <PhoneGate>
          <SaunaReservation
            initialMode={skirtukas === "renginiai" ? "event" : "private"}
            initialSaunaId={typeof pirtis === "string" ? pirtis : undefined}
            data={data}
            days={SAUNA_DAYS}
          />
        </PhoneGate>
      </BookingHero>
    </BookingPage>
  );
}
