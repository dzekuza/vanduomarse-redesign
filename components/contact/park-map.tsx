import { PARK_LOCATION } from "@/lib/contacts";

const EMBED_SRC = `https://www.google.com/maps?q=${PARK_LOCATION.latitude},${PARK_LOCATION.longitude}&z=15&output=embed`;

/**
 * Google Maps embed of the park. It loads lazily (only when scrolled near), without referrer details, and needs no API key.
 * The "Atidaryti žemėlapyje" link next to it opens the full map for directions.
 */
export function ParkMap() {
  return (
    <div className="aspect-4/3 w-full overflow-hidden border border-line bg-card sm:aspect-video">
      <iframe
        title="Vanduo Marse vieta žemėlapyje"
        src={EMBED_SRC}
        loading="lazy"
        referrerPolicy="no-referrer"
        allowFullScreen
        className="size-full border-0"
      />
    </div>
  );
}
