import type { Metadata } from "next";
import { SaunaBooking } from "@/components/booking/sauna-booking";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Pirtis Marse — rezervacija",
};

const FACTS = [
  { label: "Vieta", value: "Prie pat ežero kranto" },
  { label: "Talpa", value: "Iki 8 žmonių" },
  { label: "Trukmė", value: "90 min seansas" },
  { label: "Kūrenimas", value: "Malkomis, iš anksto" },
];

export default function PirtisPage() {
  return (
    <>
      <SiteHeader />
      <section className="px-6 pb-10 pt-4 md:px-10">
        <p className="mb-5 text-sm font-medium text-ink/60">Pirtis Marse</p>
        <h1 className="font-display max-w-2xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
          Karšta pirtis.
          <br />
          Šaltas ežeras.
        </h1>
        <p className="mt-6 max-w-md text-lg text-ink/80">
          Malkomis kūrenama pirtis prie pat vandens — išeini iš garų tiesiai į ežerą.
          Rezervuojama visai grupei, ne vietoms.
        </p>
        <dl className="mt-10 grid max-w-xl grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
          {FACTS.map((f) => (
            <div key={f.label}>
              <dt className="text-xs text-ink/50">{f.label}</dt>
              <dd className="mt-1 font-medium">{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="px-6 pb-20 md:px-10">
        <SaunaBooking />
      </section>

      <SiteFooter />
    </>
  );
}
