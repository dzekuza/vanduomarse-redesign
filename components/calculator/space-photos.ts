import { GALLERY_SLIDES, SERVICE_GALLERY, type ServicePhoto } from "@/components/landing/content";
import type { SpaceId } from "@/lib/event-pricing";

const parkPhoto = GALLERY_SLIDES[0];
const [domePhoto, nightPhoto, foodPhoto] = SERVICE_GALLERY.party;
const domePhotos = [domePhoto, parkPhoto];
const restaurantPhotos = [parkPhoto, foodPhoto];
const parkPhotos = [parkPhoto, domePhoto, nightPhoto];

/** Photos of each venue, cover first: the cover shows on the calculator's space card, all of them in its details dialog. */
export const SPACE_PHOTOS: Record<SpaceId, ServicePhoto[]> = {
  terasa: restaurantPhotos,
  "kupolas-svente": [domePhoto, nightPhoto, parkPhoto],
  "kupolas-seminaras": domePhotos,
  "kupolas-corona": domePhotos,
  corona: [parkPhoto, nightPhoto],
  restoranas: restaurantPhotos,
  parkas: parkPhotos,
  "parkas-wake": [parkPhoto, ...SERVICE_GALLERY.wake, domePhoto],
};
