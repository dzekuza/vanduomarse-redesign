import type { Metadata } from "next";
import Image from "next/image";
import { CabinBooking } from "@/components/booking/cabin-booking";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

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
    <>
      <SiteHeader />
      <section className="grid gap-10 px-6 pb-10 pt-4 md:grid-cols-[1.1fr_1fr] md:items-center md:gap-8 md:px-10">
        <div>
          <p className="mb-5 text-sm font-medium text-ink/60">Miegas Marse</p>
          <h1 className="font-display text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
            Pabusk prie
            <br />
            kabelio trasos.
          </h1>
          <p className="mt-6 max-w-md text-lg text-ink/80">
            Namelis ar kemperio aikštelė prie pat ežero. Pirmas rytinis seansas prasideda
            dar prieš pusryčius.
          </p>
          <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4 md:max-w-none">
            {FACTS.map((f) => (
              <div key={f.label}>
                <dt className="text-xs text-ink/50">{f.label}</dt>
                <dd className="mt-1 font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative aspect-[4/5] w-full overflow-hidden md:aspect-[3/4]">
          <Image
            src="https://picsum.photos/seed/lakeside-wooden-cabin-campsite-dusk/900/1200"
            alt="Namelis prie ežero"
            fill
            sizes="(min-width: 768px) 40vw, 100vw"
            className="object-cover"
          />
        </div>
      </section>

      <section className="px-6 pb-20 md:px-10">
        <CabinBooking />
      </section>

      <SiteFooter />
    </>
  );
}
