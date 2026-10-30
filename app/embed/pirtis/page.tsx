import type { Metadata } from "next";
import { SaunaReservation } from "@/components/booking/sauna-reservation";
import { SAUNA_DAYS, getSaunaPageData } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Pirtis Marse - rezervacija",
};

/** Same `?skirtukas=renginiai` switch as /pirtis. */
export default async function EmbedPirtisPage({ searchParams }: PageProps<"/embed/pirtis">) {
  const [{ skirtukas }, data] = await Promise.all([searchParams, getSaunaPageData()]);
  return <SaunaReservation initialMode={skirtukas === "renginiai" ? "event" : "private"} data={data} days={SAUNA_DAYS} />;
}
