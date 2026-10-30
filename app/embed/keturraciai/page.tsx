import type { Metadata } from "next";
import { QuadReservation } from "@/components/quads/quad-reservation";
import { QuadRules } from "@/components/quads/quad-rules";
import { getQuadPageData } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Keturračių nuoma - Vanduo Marse",
};

/** Same `?skirtukas=zygiai` switch as /keturraciai. */
export default async function EmbedQuadsPage({ searchParams }: PageProps<"/embed/keturraciai">) {
  const [{ skirtukas }, data] = await Promise.all([searchParams, getQuadPageData()]);
  return (
    <>
      <QuadReservation initialMode={skirtukas === "zygiai" ? "tour" : "rental"} data={data} />
      <QuadRules rules={data.settings.rules} />
    </>
  );
}
