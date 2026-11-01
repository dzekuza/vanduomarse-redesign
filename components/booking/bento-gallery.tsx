import Image from "next/image";

export interface GalleryImage {
  src: string;
  alt: string;
}

/**
 * Up to five photos. From `md` the first fills a 2x2 tile with the rest around
 * it; on phones it is one wide photo with the others as a row of thumbnails.
 */
export function BentoGallery({ images }: { images: GalleryImage[] }) {
  const [lead, ...rest] = images.slice(0, 5);
  if (!lead) return null;
  const several = rest.length > 0;

  return (
    <div className={`grid gap-2 ${several ? "grid-cols-4 md:h-96 md:grid-rows-2 lg:h-140" : "grid-cols-1 h-64 md:h-96 lg:h-140"}`}>
      <BentoTile
        image={lead}
        priority
        sizes="(min-width: 1024px) 40vw, (min-width: 768px) 45vw, 100vw"
        className={`rounded-tl-cut md:rounded-tl-cut-lg ${several ? "col-span-4 h-56 sm:h-72 md:col-span-2 md:row-span-2 md:h-auto" : "h-full"}`}
      />
      {rest.map((image) => (
        <BentoTile key={image.src} image={image} sizes="(min-width: 1024px) 20vw, (min-width: 768px) 22vw, 25vw" className="h-20 sm:h-24 md:h-auto" />
      ))}
    </div>
  );
}

function BentoTile({ image, sizes, className = "", priority = false }: { image: GalleryImage; sizes: string; className?: string; priority?: boolean }) {
  return (
    <figure className={`group relative overflow-hidden bg-dust-soft ${className}`}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        quality={90}
        priority={priority}
        sizes={sizes}
        className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out-strong motion-safe:group-hover:scale-105"
      />
    </figure>
  );
}
