import Image from "next/image";

export interface GalleryImage {
  src: string;
  alt: string;
}

/** Up to five photos: the first fills a 2x2 hero tile, the rest tile beside it. */
export function BentoGallery({ images }: { images: GalleryImage[] }) {
  const [lead, ...rest] = images.slice(0, 5);
  if (!lead) return null;

  return (
    <div className={`grid h-72 gap-2 md:h-80 ${rest.length ? "grid-cols-4 grid-rows-2" : "grid-cols-1"}`}>
      <BentoTile image={lead} sizes="(min-width: 1024px) 24vw, 50vw" className="col-span-2 row-span-2" />
      {rest.map((image) => (
        <BentoTile key={image.src} image={image} sizes="(min-width: 1024px) 12vw, 25vw" />
      ))}
    </div>
  );
}

function BentoTile({ image, sizes, className = "" }: { image: GalleryImage; sizes: string; className?: string }) {
  return (
    <figure className={`group relative overflow-hidden bg-dust-soft ${className}`}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
      />
    </figure>
  );
}
