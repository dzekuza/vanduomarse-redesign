import { SERVICE_GALLERY, type ServicePhoto } from "@/components/landing/content";
import { QUAD_TOUR_GALLERY } from "@/components/quads/quad-tour-content";
import type { ActivityId, ReservationData } from "@/lib/reservation";

/** One photo collection for the activity dialog, reservation panel and mobile plan. */
export function activityPhotos(id: ActivityId, data?: ReservationData): ServicePhoto[] {
  const photos = id === "pirtis"
    ? [
      ...SERVICE_GALLERY.sauna,
      ...(data?.sauna.saunas.flatMap((sauna) => sauna.photos.map((photo) => ({ src: photo.url, alt: sauna.name }))) ?? []),
    ]
    : id === "nakvyne" ? SERVICE_GALLERY.cabins : QUAD_TOUR_GALLERY;
  return Array.from(new Map(photos.map((photo) => [photo.src, photo])).values());
}
