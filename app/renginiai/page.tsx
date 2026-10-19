import type { Metadata } from "next";
import { ArrowLink } from "@/components/arrow-link";
import { BookingPage } from "@/components/booking/booking-page";
import { EventsBoard } from "@/components/events/events-board";

export const metadata: Metadata = {
  title: "Renginiai Marse",
  description: "Artimiausi Vanduo Marse renginiai: pirties ritualai, vakarai prie ežero, Marso Akademija ir šventės.",
};

export default function RenginiaiPage() {
  return (
    <BookingPage>
      <section className="px-6 pb-20 pt-6 md:px-10 md:pt-10">
        <div className="max-w-3xl">
          <p className="mb-6 inline-block border border-ink px-4 py-2 text-xs uppercase">Renginiai Marse</p>
          <h1 className="font-display text-4xl font-bold leading-[1.02] sm:text-5xl xl:text-6xl">
            Kas vyksta
            <br />
            Marse.
          </h1>
          <p className="mt-6 max-w-md text-ink/80">
            Pirties ritualai, vakarai prie ežero, Akademijos treniruotės ir šventės. Artimiausios 30 dienų vienoje vietoje.
          </p>
          <div className="mt-6">
            <ArrowLink href="/skaiciuokle">Planuoji savo renginį? Apskaičiuok kainą</ArrowLink>
          </div>
        </div>
        <div className="mt-12">
          <EventsBoard />
        </div>
      </section>
    </BookingPage>
  );
}
