import { PARK_ADDRESS } from "@/components/landing/content";
import { PARK_LOCATION } from "@/lib/contacts";

const EMBED_SRC = `https://www.google.com/maps?q=${PARK_LOCATION.latitude},${PARK_LOCATION.longitude}&z=15&output=embed`;

/**
 * Google Maps embed of the park, tinted to the site: the map is desaturated and multiplied onto the page's dust colour, so it
 * reads as a warm duotone instead of Google's green and blue, with an ink label for the address. It fills the height of its
 * grid row on wide screens. It loads lazily, without referrer details and without an API key; the map stays fully interactive.
 */
export function ParkMap() {
  return (
    <div className="relative aspect-4/3 w-full overflow-hidden border border-line bg-dust lg:aspect-auto lg:h-full lg:min-h-96">
      <iframe
        title="Vanduo Marse vieta žemėlapyje"
        src={EMBED_SRC}
        loading="lazy"
        referrerPolicy="no-referrer"
        allowFullScreen
        className="absolute inset-0 size-full border-0 mix-blend-multiply contrast-110 grayscale"
      />
      <p className="pointer-events-none absolute top-0 left-0 bg-ink px-4 py-2 text-micro font-bold uppercase text-foam">
        Vanduo Marse · {PARK_ADDRESS.compact}
      </p>
    </div>
  );
}
