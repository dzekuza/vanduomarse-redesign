import photoManifest from "@/public/quads/ciongo/manifest.json";

/**
 * Photos of the tour partner. The routes, gear and prices are database rows
 * (`quad_tour_routes`, `quad_tour_accessories`), never constants (ADR-0053).
 */
export const QUAD_TOUR_GALLERY = photoManifest.photos
  .filter((photo) => photo.section === "gallery")
  .map(({ src, alt }) => ({ src, alt }));

export const QUAD_TOUR_SOURCE = photoManifest.sourcePage;
