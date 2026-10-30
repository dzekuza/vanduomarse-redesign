import type { Metadata } from "next";
import { EmbedTheme } from "@/components/embed/embed-theme";
import { EventsBoard } from "@/components/events/events-board";
import { getParkEvents } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Renginiai Marse",
};

export default async function EmbedRenginiaiPage({ searchParams }: PageProps<"/embed/renginiai">) {
  const [params, events] = await Promise.all([searchParams, getParkEvents()]);
  return (
    <>
      <EmbedTheme params={params} />
      <EventsBoard data={events} />
    </>
  );
}
