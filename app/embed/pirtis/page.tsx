import type { Metadata } from "next";
import { EmbedTheme } from "@/components/embed/embed-theme";
import { SaunaReservation } from "@/components/booking/sauna-reservation";
import { SAUNA_DAYS, getSaunaPageData } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Pirtis Marse - rezervacija",
};

/** Same `?skirtukas=renginiai` and `?pirtis=<id>` switches as /pirtis. */
export default async function EmbedPirtisPage({ searchParams }: PageProps<"/embed/pirtis">) {
  const [params, data] = await Promise.all([searchParams, getSaunaPageData()]);
  return (
    <>
      <EmbedTheme params={params} />
      <SaunaReservation
        initialMode={params.skirtukas === "renginiai" ? "event" : "private"}
        initialSaunaId={typeof params.pirtis === "string" ? params.pirtis : undefined}
        data={data}
        days={SAUNA_DAYS}
      />
    </>
  );
}
