import type { Metadata } from "next";
import { TeamSection } from "@/components/about/team-section";
import { BookingPage } from "@/components/booking/booking-page";
import { Cta } from "@/components/cta";
import { PageIntro } from "@/components/page-intro";

export const metadata: Metadata = {
  title: "Apie Marsą | Vanduo Marse",
  description: "Susipažink su Vanduo Marse komanda, pirties seansų vedėjais ir vandenlenčių parku Kauno rajone.",
};

export default function ApieMarsaPage() {
  return (
    <BookingPage>
      <main>
        <PageIntro
          eyebrow="Vanduo Marse"
          title={["Apie", "Marsą."]}
          intro="Vanduo Marse yra vandenlenčių parkas Kauno rajone. Čia galima išmokti čiuožti vandenlente, sušilti pirtyje, susitikti prie stalo ir pasilikti nakčiai."
        >
          <Cta tone="cream" small href="#komanda">
            Susipažink su komanda
          </Cta>
        </PageIntro>
        <TeamSection />
      </main>
    </BookingPage>
  );
}
