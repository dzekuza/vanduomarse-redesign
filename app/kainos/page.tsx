import type { Metadata } from "next";
import Link from "next/link";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import { JsonLd } from "@/components/json-ld";
import { ServicePricing } from "@/components/services/service-pricing";
import { SERVICE_PAGES, type ServiceSlug } from "@/components/services/service-content";
import { getCabinPageData, getQuadPageData, getSaunaPageData } from "@/lib/data/public";
import { RESERVATION_DAYS } from "@/lib/reservation";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Kainos: pirtis, keturračiai, nameliai",
  description: "Vanduo Marse kainos su 21% PVM: pirties seansai ir nuoma, keturračių turai, nameliai ir vietos kemperiams, šventų erdvių nuoma. Atnaujinama automatiškai.",
  path: "/kainos",
});

/** The services with a price list, in the order visitors ask about them. Wake rides and the restaurant have no fixed list online. */
const SECTIONS: ServiceSlug[] = ["pirtis", "keturraciu-nuoma", "nakvyne", "sventes"];

/** One page with every published price, read from the same data as the service pages, so it never drifts from them. */
export default async function PricesPage() {
  const window = { days: RESERVATION_DAYS, now: new Date() };
  const [sauna, cabin, quads] = await Promise.all([getSaunaPageData(window), getCabinPageData(window), getQuadPageData(window)]);

  return (
    <BookingPage>
      <JsonLd data={breadcrumbSchema({ name: "Kainos", path: "/kainos" })} />
      <div className="theme-reservation px-gutter pt-10 pb-16 md:pt-14 md:pb-24">
        <div className="max-w-3xl space-y-10">
          <BookingHeader
            crumb="Kainos"
            title={["Kainos", "Vanduo Marse"]}
            intro="Visos kainos nurodytos eurais su 21% PVM. Galutinę kainą matysi rezervuodamas. Vandenlenčių plaukimų ir treniruočių kainas sužinosi pas Marso Akademiją, restorano meniu pas restoraną."
          />
          {SECTIONS.map((slug) => (
            <section key={slug} id={slug} aria-labelledby={`${slug}-kainos`} className="scroll-mt-32 space-y-4 border-t border-line pt-7">
              <h2 id={`${slug}-kainos`} className="text-tile font-bold">
                <Link href={`/${slug}`} className="hover:text-rust">{SERVICE_PAGES[slug].label}</Link>
              </h2>
              <ServicePricing slug={slug} sauna={slug === "pirtis" ? sauna : undefined} quads={slug === "keturraciu-nuoma" ? quads : undefined} stayTypes={slug === "nakvyne" ? cabin.stayTypes : undefined} />
            </section>
          ))}
        </div>
      </div>
    </BookingPage>
  );
}
