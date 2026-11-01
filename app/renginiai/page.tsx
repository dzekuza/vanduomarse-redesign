import type { Metadata } from "next";
import { BookingPage } from "@/components/booking/booking-page";
import { Cta } from "@/components/cta";
import { PageIntro } from "@/components/page-intro";
import { EventsBoard } from "@/components/events/events-board";
import { getParkEvents } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Renginiai Marse",
  description: "Artimiausi Vanduo Marse renginiai: pirties ritualai, vakarai prie ežero, Marso Akademija ir šventės.",
};

export default async function RenginiaiPage() {
  const events = await getParkEvents();

  return (
    <BookingPage>
      <PageIntro
        eyebrow="Renginiai Marse"
        title={["Kas vyksta", "Marse."]}
        intro="Pirties ritualai, vakarai prie ežero, Akademijos treniruotės ir šventės. Artimiausios 30 dienų vienoje vietoje."
      >
        <Cta tone="coral" href="/skaiciuokle">
          Apskaičiuok renginio kainą
        </Cta>
      </PageIntro>
      <section className="px-gutter py-12 md:py-16">
        <EventsBoard data={events} />
      </section>
    </BookingPage>
  );
}
