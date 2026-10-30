import type { Metadata } from "next";
import { EmbedTheme } from "@/components/embed/embed-theme";
import { CabinBooking } from "@/components/booking/cabin-booking";
import { CABIN_DAYS, getCabinPageData } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Miegas Marse - rezervacija",
};

export default async function EmbedMiegasPage({ searchParams }: PageProps<"/embed/miegas">) {
  const [params, data] = await Promise.all([searchParams, getCabinPageData()]);
  return (
    <>
      <EmbedTheme params={params} />
      <CabinBooking data={data} days={CABIN_DAYS} />
    </>
  );
}
