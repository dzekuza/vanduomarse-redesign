import type { Metadata } from "next";
import { BookingHero } from "@/components/booking/booking-hero";
import { BookingPage } from "@/components/booking/booking-page";
import { QuadReservation } from "@/components/quads/quad-reservation";
import { getQuadPageData } from "@/lib/data/public";
import { hourLabel, type QuadSettings, type QuadType } from "@/lib/quads";

export const metadata: Metadata = {
  title: "Keturračių nuoma - Vanduo Marse",
  description: "Keturračių nuoma valandoms ir žygiai su gidu prie Vanduo Marse. Pateik užklausą internetu, patvirtinsime telefonu ar el. paštu.",
};

/** Opening hours, price and age follow the live fleet and settings from /admin/keturraciai. */
const facts = (types: QuadType[], s: QuadSettings) => [
  { label: "Darbo laikas", value: `${hourLabel(s.openHour)}-${hourLabel(s.closeHour)}` },
  { label: "Kaina", value: types.length ? `Nuo ${Math.min(...types.map((t) => t.pricePerHour))} €/val.` : "Pagal susitarimą" },
  { label: "Amžius", value: `Nuo ${s.minAge} m.` },
  { label: s.deposit > 0 ? "Užstatas" : "Trukmė", value: s.deposit > 0 ? `${s.deposit} €, grąžinamas` : `Iki ${s.maxHours} val.` },
];

// Unsplash (free licence) stand-ins until the client supplies real quad photos.
const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=75`;

const GALLERY = [
  { src: unsplash("1489731254138-5401fb834d9c"), alt: "Žmogus važiuoja keturračiu" },
  { src: unsplash("1653859465778-58b3e964cadc"), alt: "Keturratis pievoje prie medžio" },
  { src: unsplash("1496521061024-90e1c1221555"), alt: "Vyras ir moteris ant keturračio" },
  { src: unsplash("1515007507252-fc11563a273e"), alt: "Keturračių eilė žolėje" },
  { src: unsplash("1675428604186-a165487f857c"), alt: "Keturratis žvyrkeliu" },
];

/** `?skirtukas=zygiai` opens the tours tab (linked from /renginiai). */
export default async function QuadsPage({ searchParams }: PageProps<"/keturraciai">) {
  const [{ skirtukas }, data] = await Promise.all([searchParams, getQuadPageData()]);

  return (
    <BookingPage>
      <BookingHero
        eyebrow="Keturračiai Marse"
        title={["Keturračiai", "prie ežero."]}
        intro="Išsinuomok keturratį valandai ar kelioms arba prisijunk prie žygio su gidu. Užklausą patvirtinsime telefonu ar el. paštu."
        facts={facts(data.types, data.settings)}
        gallery={GALLERY}
      >
        <QuadReservation initialMode={skirtukas === "zygiai" ? "tour" : "rental"} data={data} />
        {data.settings.rules ? (
          <section className="mt-8 border border-ink p-6">
            <h2 className="font-display text-sm font-bold">Taisyklės</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-ink/80">{data.settings.rules}</p>
          </section>
        ) : null}
      </BookingHero>
    </BookingPage>
  );
}
