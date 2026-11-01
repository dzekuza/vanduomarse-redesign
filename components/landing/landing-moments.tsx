import { MomentsGallery } from "./moments-gallery";
import { Reveal } from "@/components/reveal";
import { SectionKicker } from "@/components/section-kicker";

/** `04`: dark photo gallery. */
export function LandingMoments() {
  return (
    <section aria-labelledby="moments-title" className="overflow-hidden bg-ink px-gutter py-14 text-dust md:py-19">
      <SectionKicker left="04 / VAIZDAI IŠ MARSO" right="TIKRA VIETA. TIKRI MOMENTAI." />
      <Reveal>
        <MomentsGallery />
      </Reveal>
    </section>
  );
}
