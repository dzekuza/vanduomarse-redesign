import type { Metadata } from "next";
import { CabinBooking } from "@/components/booking/cabin-booking";
import { CABIN_DAYS, getCabinPageData } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Miegas Marse - rezervacija",
};

export default async function EmbedMiegasPage() {
  const data = await getCabinPageData();
  return <CabinBooking data={data} days={CABIN_DAYS} />;
}
