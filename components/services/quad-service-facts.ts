import type { QuadPageData } from "@/lib/data/public-types";
import type { ServicePageCopy } from "./service-content";

/** The route list and the group minimum, from the tour rows so they cannot drift from what is bookable. */
export function quadFacts(quads: QuadPageData): ServicePageCopy["facts"] {
  const routes = quads.tourRoutes;
  if (routes.length === 0) return [];
  const minimum = Math.min(...routes.map((route) => route.minUnits));
  return [
    { label: "Trasos", value: routes.map((route) => `${route.name} (${route.kilometres} km, ${route.hours} val.)`).join(", ") },
    { label: "Grupė", value: `Turui reikia bent ${minimum} keturračių.` },
  ];
}
