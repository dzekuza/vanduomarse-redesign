import type { Metadata } from "next";
import { EventsBoard } from "@/components/events/events-board";
import { getParkEvents } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Renginiai Marse",
};

export default async function EmbedRenginiaiPage() {
  const events = await getParkEvents();
  return <EventsBoard data={events} />;
}
