import type { QuadPageData } from "@/lib/data/public-types";
import type { ServicePageCopy } from "./service-content";

/** The route list and the group minimum, from the tour rows so they cannot drift from what is bookable. */
export function quadFacts(quads: QuadPageData): ServicePageCopy["facts"] {
  const { tourRoutes: routes, types, settings } = quads;
  const facts: ServicePageCopy["facts"] = [];
  if (routes.length > 0) {
    const minimum = Math.min(...routes.map((route) => route.minUnits));
    facts.push(
      { label: "Trasos", value: routes.map((route) => `${route.name} (${route.kilometres} km, ${route.hours} val.)`).join(", ") },
      { label: "Grupė", value: `Turui reikia bent ${minimum} keturračių.` },
    );
  }
  if (types.length > 0) {
    const from = Math.min(...types.map((type) => type.pricePerHour));
    facts.push({ label: "Nuoma valandomis", value: `Nuo ${from} € / val. Ilgiausia nuoma ${settings.maxHours} val., vairuotojui nuo ${settings.minAge} m.` });
  }
  return facts;
}
