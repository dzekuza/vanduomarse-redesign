import type { Metadata } from "next";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import { ContactDetails } from "@/components/contact/contact-details";
import { ParkMap } from "@/components/contact/park-map";
import { JsonLd } from "@/components/json-ld";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, contactPageSchema } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Kontaktai ir kaip atvykti",
  description: "Vanduo Marse adresas Žemaitkiemyje, Kauno rajone, telefonai ir el. paštai pirčiai, restoranui, renginiams ir Marso Akademijai.",
  path: "/kontaktai",
});

export default function ContactPage() {
  return (
    <BookingPage>
      <JsonLd data={contactPageSchema()} />
      <JsonLd data={breadcrumbSchema({ name: "Kontaktai", path: "/kontaktai" })} />
      <div className="theme-reservation px-gutter pt-10 pb-16 md:pt-14 md:pb-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="min-w-0 max-w-3xl space-y-10 lg:col-span-8">
            <BookingHeader
              crumb="Kontaktai"
              title={["Susisiek", "su Marsu"]}
              intro="Rezervacijų ir klausimų laukiame telefonu ar el. paštu. Parkas yra Žemaitkiemyje, maždaug 20 minučių nuo Kauno centro."
            />
            <ContactDetails />
          </div>
          <section aria-label="Žemėlapis" className="min-w-0 lg:col-span-4">
            <ParkMap />
          </section>
        </div>
      </div>
    </BookingPage>
  );
}
