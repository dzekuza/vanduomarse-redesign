import type { Metadata } from "next";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import { EventsAside } from "@/components/events/events-aside";
import { EventsBoard } from "@/components/events/events-board";
import { getParkEvents } from "@/lib/data/public";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Renginiai Marse: pirties ritualai ir vakarai prie ežero",
  description: "Artimiausi Vanduo Marse renginiai Kauno rajone: pirties ritualai, vakarai prie ežero, Marso Akademijos treniruotės ir šventės.",
  path: "/renginiai",
});

export default async function RenginiaiPage() {
  const events = await getParkEvents();

  return (
    <BookingPage>
      <div className="theme-reservation px-gutter pt-10 pb-16 md:pt-14 md:pb-24">
        <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
          <div className="min-w-0 space-y-10 lg:col-span-2">
            <BookingHeader
              crumb="Renginiai"
              title={["Kas vyksta", "Vanduo Marse"]}
              intro="Renginiai, pirties ritualai, wake akademijos treniruotės ir šventės. Artimiausios 30 dienų vienoje vietoje."
            />
            <EventsBoard data={events} />
          </div>
          <EventsAside />
        </div>
      </div>
    </BookingPage>
  );
}
