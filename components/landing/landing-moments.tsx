import { MomentsGallery } from "./moments-gallery";
import { Reveal } from "@/components/reveal";
import { SectionKicker } from "@/components/section-kicker";

/** `04`: dark photo gallery. */
export function LandingMoments() {
  return (
    <section aria-labelledby="moments-title" className="overflow-hidden bg-ink px-gutter py-14 text-dust md:py-19">
      <SectionKicker left="04 / GALERIJA" right={"APŽIŪRĖK\nVANDUO MARSE PARKĄ."} className="whitespace-pre-line" />
      <Reveal>
        <MomentsGallery />
      </Reveal>
    </section>
  );
}
