import type { Metadata } from "next";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import { RegistrationFlow } from "@/components/registration/registration-flow";

export const metadata: Metadata = {
  title: "Registracija - Vanduo Marse",
  description: "Užsiregistruok internetu — kontaktai, nuotrauka ir taisyklių sutikimas — ir darbuotojas kasoje iškart priskirs tau apyrankę.",
};

export default function RegistrationPage() {
  return (
    <BookingPage>
      <div className="theme-reservation px-gutter pt-10 pb-16 md:pt-14 md:pb-24">
        <div className="mx-auto max-w-2xl space-y-8">
          <BookingHeader
            crumb="Registracija"
            title={["Tapk", "Vanduo Marse nariu"]}
            intro="Užpildyk kontaktus, nusifotografuok ir pasirašyk taisykles — darbuotojas kasoje iškart priskirs tau apyrankę."
          />
          <RegistrationFlow />
        </div>
      </div>
    </BookingPage>
  );
}
