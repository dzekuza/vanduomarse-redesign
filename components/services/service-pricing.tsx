import { guestsLabel, type StayType } from "@/lib/cabin";
import type { QuadPageData, SaunaPageData } from "@/lib/data/public-types";
import { SPACES, formatMoney } from "@/lib/event-pricing";
import { programPriceLine } from "@/lib/sauna-programs";
import type { ServiceSlug } from "./service-content";

function prices(slug: ServiceSlug, sauna?: SaunaPageData, quads?: QuadPageData, stayTypes?: StayType[]) {
  if (slug === "pirtis") return sauna?.programs.map((program) => ({
    label: program.name,
    price: programPriceLine(program),
    note: program.kind === "private" && program.capacity
      ? `Iki ${program.capacity} žmonių. ${program.description}`
      : program.description,
  })) ?? [];
  if (slug === "keturraciu-nuoma") return [
    ...(quads?.tourRoutes ?? []).map((route) => ({
      label: `${route.name} turas`,
      price: `${route.price} € / keturračiui`,
      note: `${route.kilometres} km · ${route.hours} val. · bent ${route.minUnits} keturračiai`,
    })),
    ...(quads?.tourAccessories ?? []).map((gear) => ({ label: gear.name, price: `${gear.price} € / vnt.`, note: "Papildoma įranga" })),
  ];
  if (slug === "nakvyne") return (stayTypes ?? []).map((type) => ({
    label: type.label,
    price: `${type.pricePerNight} € / naktį`,
    note: [type.kind === "kemperis" ? "Viena transporto priemonė" : "", type.note, `Telpa ${guestsLabel(type.maxGuests)}`].filter(Boolean).join(". ") + ".",
  }));
  if (slug === "restoranas" || slug === "vandenlentes") return [];
  const spaceIds = slug === "imoniu-renginiai"
    ? ["kupolas-seminaras", "kupolas-svente", "parkas"]
    : slug === "vestuves" ? ["terasa", "kupolas-svente", "kupolas-corona"] : ["terasa", "restoranas", "kupolas-svente"];
  return SPACES.filter((space) => spaceIds.includes(space.id)).map((space) => {
    const days = ["weekday", "weekend"] as const;
    const rents = days.map((day) => space.rent(day, 20)).filter((value): value is number => value !== null);
    const minSpend = { min: space.minSpend("weekday", 20), max: space.minSpend("weekend", 20) };
    const minimum = minSpend.max > 0 ? `Min. sąskaita ${formatMoney(minSpend)}.` : "";
    const rent = rents.length ? { min: Math.min(...rents), max: Math.max(...rents) } : null;
    const price = rent && rent.max > 0 ? formatMoney(rent) : minimum;
    return {
      label: space.label,
      price,
      note: [`Iki ${space.maxGuests} žmonių.`, space.blurb, rent && rent.max > 0 ? minimum : ""].filter(Boolean).join(" "),
    };
  });
}

export function ServicePricing({ slug, sauna, quads, stayTypes }: { slug: ServiceSlug; sauna?: SaunaPageData; quads?: QuadPageData; stayTypes?: StayType[] }) {
  const rows = prices(slug, sauna, quads, stayTypes);
  return (
    <div className="space-y-3">
      {rows.length ? (
        <ul className="divide-y divide-line border-y border-line">
          {rows.map(({ label, price, note }) => (
            <li key={label} className="py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
                <h3 className="text-sm font-bold">{label}</h3>
                <p className="text-sm font-bold">{price}</p>
              </div>
              {note ? <p className="mt-1 text-xs leading-relaxed text-copy">{note}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-copy">{slug === "restoranas" ? "Dienos meniu ir kainas sužinosi susisiekęs su restoranu. Renginių meniu parengiame pagal svečių skaičių ir progą."
          : slug === "vandenlentes" ? "Dėl aktualių plaukimų, treniruočių ir įrangos kainų susisiek su Marso Akademija."
            : "Dėl privačios nuomos kainų susisiek su Pirtis Marse komanda."}</p>
      )}
      {slug === "pirtis" ? <p className="text-xs text-copy">Suplanuotų seansų kainos ir laisvos vietos nurodytos tvarkaraštyje.</p> : null}
      {slug === "keturraciu-nuoma" ? <p className="text-xs text-copy">Kainos su PVM. Kaina už keturratį, vienam ar dviem keleiviams ta pati.</p> : null}
      {["sventes", "vestuves", "imoniu-renginiai", "gimtadieniai"].includes(slug) ? <p className="text-xs text-copy">Orientacinės erdvių kainos ir minimalios sąskaitos pavyzdžiai 20 svečių grupei. Galutinė sąmata priklauso nuo datos, svečių skaičiaus ir paslaugų.</p> : null}
    </div>
  );
}
