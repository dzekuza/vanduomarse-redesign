import { BentoGallery, type GalleryImage } from "./bento-gallery";

interface Fact {
  label: string;
  value: string;
}

/**
 * Booking route intro, styled after the live site's sector pages: copy, facts
 * and a bento photo gallery on the left, the booking form beside it.
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
  facts: Fact[];
  gallery: GalleryImage[];
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-10 px-6 pb-20 pt-6 md:px-10 md:pt-10 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-12">
      <div className="min-w-0">
        <p className="mb-6 inline-block border border-ink px-4 py-2 text-xs uppercase">{eyebrow}</p>
        <h1 className="font-display text-4xl font-bold leading-[1.02] sm:text-5xl xl:text-6xl">
          {title[0]}
          <br />
          {title[1]}
        </h1>
        <p className="mt-6 max-w-md text-ink/80">{intro}</p>
        <dl className="mt-10 grid grid-cols-2 border-t border-ink">
          {facts.map((f) => (
            <div key={f.label} className="border-b border-ink/50 py-4 pr-4">
              <dt className="font-display text-xs font-bold">{f.label}</dt>
              <dd className="mt-1 text-sm">{f.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-10">
          <BentoGallery images={gallery} />
        </div>
      </div>
      <div className="min-w-0 lg:sticky lg:top-28">{children}</div>
    </section>
  );
}
