import type { Metadata } from "next";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import { ContactDetails } from "@/components/contact/contact-details";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Kontaktai ir kaip atvykti",
  description: "Vanduo Marse adresas Žemaitkiemyje, Kauno rajone, telefonai ir el. paštai pirčiai, restoranui, renginiams ir Marso Akademijai.",
  path: "/kontaktai",
});

export default function ContactPage() {
  return (
    <BookingPage>
      <div className="theme-reservation px-gutter pt-10 pb-16 md:pt-14 md:pb-24">
        <div className="max-w-3xl space-y-10">
          <BookingHeader
            crumb="Kontaktai"
            title={["Susisiek", "su Marsu"]}
            intro="Rezervacijų ir klausimų laukiame telefonu ar el. paštu. Parkas yra Žemaitkiemyje, maždaug 20 minučių nuo Kauno centro."
          />
          <ContactDetails />
        </div>
      </div>
    </BookingPage>
  );
}
