import type { Metadata } from "next";
import Image from "next/image";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import { Cta } from "@/components/cta";
import { QuadInformation } from "@/components/quads/quad-information";
import { QUAD_TOUR_SOURCE } from "@/components/quads/quad-tour-content";
import { QuadTourGallery } from "@/components/quads/quad-tour-gallery";
import { ReservationFlow } from "@/components/reservation/reservation-flow";
import { getCustomer } from "@/lib/customer";
import { getCabinPageData, getQuadPageData, getSaunaPageData } from "@/lib/data/public";
import { RESERVATION_DAYS } from "@/lib/reservation";
import { paymentsEnabled } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Keturračių turai Marse. Dizaino peržiūra",
  description: "Mini, Midi ir Maxi keturračių trasos. Interaktyvi Vanduo Marse dizaino peržiūra.",
  robots: { index: false, follow: false },
};

export default async function QuadsPreviewPage() {
  const availabilityWindow = { days: RESERVATION_DAYS, now: new Date() };
  const [sauna, cabin, data, customer] = await Promise.all([
    getSaunaPageData(availabilityWindow), getCabinPageData(availabilityWindow), getQuadPageData(availabilityWindow), getCustomer(),
  ]);
  return (
    <BookingPage>
      <div className="theme-reservation">
        <section className="grid gap-8 px-gutter pt-10 pb-10 lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-14">
          <div className="space-y-6">
            <span className="inline-flex min-h-11 items-center border border-line px-3 text-micro uppercase">Dizaino peržiūra · Vanduo Marse × Ciongo</span>
            <BookingHeader crumb="Keturračiai" title={["Mažiau asfalto.", "Daugiau Marso."]} intro="Miškas, posūkiai ir gera kompanija. Išvažiuojam iš Marso, grįžtam su istorijomis." />
            <div className="flex flex-wrap gap-3 text-micro uppercase text-copy">
              <span>20–50 km</span><span aria-hidden>✳</span><span>Su gidu</span><span aria-hidden>✳</span><span>Visais sezonais</span>
            </div>
            <Cta tone="dark" href="#trasos">Planuok turą</Cta>
          </div>
          <div className="relative aspect-video bg-dust-soft lg:aspect-square">
            <Image src="/quads/ciongo/forest-pair.webp" alt="Keturračiai miško trasoje" fill loading="eager" fetchPriority="high" quality={90} sizes="(min-width: 1024px) 48vw, 92vw" className="object-cover" />
            <span className="absolute bottom-4 left-4 bg-dust px-3 py-2 text-micro uppercase text-ink">Startas iš Marso</span>
          </div>
        </section>
        <section id="trasos" aria-label="Keturračių turo rezervacija" className="scroll-mt-32 space-y-6 px-gutter pb-16 lg:pb-24">
          <h2 className="text-heading font-bold">Kada susitinkam?</h2>
          <ReservationFlow activity="keturraciai" wide header={null} data={{ sauna, cabin, quads: data }} payments={paymentsEnabled()} initialCustomer={customer} />
        </section>
        <section className="grid gap-10 px-gutter pb-16 lg:grid-cols-2 lg:gap-16 lg:pb-24">
          <QuadInformation accessories={data.tourAccessories} />
          <div className="space-y-6">
            <figure>
              <div className="relative aspect-video bg-dust-soft"><Image src="/quads/ciongo/loncin-quad.webp" alt="Loncin dvivietis keturratis" fill sizes="(min-width: 1024px) 45vw, 90vw" className="object-cover" /></div>
              <figcaption className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line py-4">
                <span className="text-item font-bold">Loncin</span>
                <span className="text-micro uppercase text-copy">44 AG · 2 vietos · Vairo stiprintuvas</span>
              </figcaption>
            </figure>
            <figure>
              <div className="relative aspect-video bg-dust-soft"><Image src="/quads/ciongo/night-tour.webp" alt="Keturračių turas sutemus" fill sizes="(min-width: 1024px) 45vw, 90vw" className="object-cover" /></div>
              <figcaption className="border-b border-line py-4 text-item font-bold">Marsas po saulėlydžio.</figcaption>
            </figure>
          </div>
        </section>
        <div className="space-y-8 px-gutter pb-16 lg:pb-24">
          <QuadTourGallery />
          <p className="text-xs text-copy">Peržiūros trasų informacija ir laikinos nuotraukos iš <a href={QUAD_TOUR_SOURCE} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center underline underline-offset-4">Ciongo</a>.</p>
        </div>
      </div>
    </BookingPage>
  );
}
