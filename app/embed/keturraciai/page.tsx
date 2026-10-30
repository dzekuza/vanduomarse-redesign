import type { Metadata } from "next";
import { EmbedTheme } from "@/components/embed/embed-theme";
import { PhoneGate } from "@/components/booking/phone-gate";
import { QuadReservation } from "@/components/quads/quad-reservation";
import { QuadRules } from "@/components/quads/quad-rules";
import { getQuadPageData } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Keturračių nuoma - Vanduo Marse",
};

/** Same `?skirtukas=zygiai` switch as /keturraciai. */
export default async function EmbedQuadsPage({ searchParams }: PageProps<"/embed/keturraciai">) {
  const [params, data] = await Promise.all([searchParams, getQuadPageData()]);
  return (
    <>
      <EmbedTheme params={params} />
      <PhoneGate>
        <QuadReservation initialMode={params.skirtukas === "zygiai" ? "tour" : "rental"} data={data} />
      </PhoneGate>
      <QuadRules rules={data.settings.rules} />
    </>
  );
}
