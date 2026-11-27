import photoManifest from "@/public/quads/ciongo/manifest.json";

/**
 * Photos of the tours (shot with Ciongo, in public/quads/marse). The routes, gear and prices are database rows
 * (`quad_tour_routes`, `quad_tour_accessories`), never constants (ADR-0053).
 */
export const QUAD_TOUR_GALLERY = [
  { src: "/quads/marse/forest-road-pair.webp", alt: "Du keturračiai su Ciongo instruktoriais miško žvyrkelyje" },
  { src: "/quads/marse/field-drift.webp", alt: "Loncin keturratis pievoje taško žemes" },
  { src: "/quads/marse/riders-start.webp", alt: "Dvi vairuotojos ant keturračių prie ežero prieš turą" },
  { src: "/quads/marse/instructor-back.webp", alt: "Ciongo instruktorius ant keturračio miško kelyje" },
  { src: "/quads/marse/instructor-check.webp", alt: "Vairuotoja šalmu atsisuka į Ciongo instruktorių miške" },
  { src: "/quads/marse/rider-helmet.webp", alt: "Vairuotojas šalmu prieš keturračių turą" },
];

export const QUAD_TOUR_SOURCE = photoManifest.sourcePage;
