import { PageIntro, type IntroFact } from "@/components/page-intro";
import { BentoGallery, type GalleryImage } from "./bento-gallery";

/**
 * Booking route intro: dark `PageIntro` with the facts, then the photo gallery
 * (sticky from `lg`) beside the booking form. On phones the form comes first.
 */
export function BookingHero({
  eyebrow,
  title,
  intro,
  facts,
  gallery,
  children,
}: {
  eyebrow: string;
  title: [string, string];
  intro: string;
  facts: IntroFact[];
  gallery: GalleryImage[];
  children: React.ReactNode;
}) {
  return (
    <>
      <PageIntro eyebrow={eyebrow} title={title} intro={intro} facts={facts} />
      <section className="grid gap-10 px-gutter py-12 md:py-16 lg:grid-cols-2 lg:items-start lg:gap-12">
        <div className="min-w-0 max-lg:order-2 lg:sticky lg:top-8">
          <BentoGallery images={gallery} />
        </div>
        <div className="min-w-0">{children}</div>
      </section>
    </>
  );
}
