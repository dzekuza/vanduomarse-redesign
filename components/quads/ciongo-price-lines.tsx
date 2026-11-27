import {
  CIONGO_DEFAULT_PEOPLE,
  CIONGO_OVERNIGHT_PER_PERSON,
  CIONGO_SAUNA_HOURS,
  ciongoEstimate,
  ciongoSaunaPrice,
  type CiongoPackage,
  type CiongoPriceSources,
} from "@/lib/ciongo-packages";
import { formatMoney } from "@/lib/event-pricing";

/**
 * What a package costs line by line for the sheet's group of 10: each item with its price, the sauna as both choices
 * (Finnish or wood-fired, Mon–Thu / Fri–Sun) and optional cabins as an extra. Shared by the package rows and the details popup.
 */
export function CiongoPriceLines({ pkg, sources }: { pkg: CiongoPackage; sources: CiongoPriceSources }) {
  const estimate = ciongoEstimate(pkg, { people: CIONGO_DEFAULT_PEOPLE, sauna: "suomiska", overnight: false, day: null }, sources);
  const finnish = ciongoSaunaPrice("suomiska", CIONGO_DEFAULT_PEOPLE, sources, null);
  const wood = ciongoSaunaPrice("malkine", CIONGO_DEFAULT_PEOPLE, sources, null);

  return (
    <ul className="space-y-2.5">
      {estimate.lines.map((line) => (
        <li key={line.id} className="flex items-start justify-between gap-3 text-xs">
          <span className="min-w-0">
            <span className="block font-bold">{line.id === "pirtis" ? `Pirtis · ${CIONGO_SAUNA_HOURS} val.` : line.title}</span>
            <span className="block leading-relaxed text-copy">
              {line.id === "pirtis"
                ? `Suomiška ${finnish ? formatMoney(finnish) : ""}${wood ? ` arba malkinė su pirtininku ${formatMoney(wood)}` : ""} (I–IV / V–VII).`
                : line.detail}
            </span>
          </span>
          <span className="shrink-0 font-bold tabular-nums">{formatMoney(line.amount)}</span>
        </li>
      ))}
      {pkg.overnight === "optional" ? (
        <li className="flex items-start justify-between gap-3 text-xs">
          <span className="min-w-0">
            <span className="block font-bold">Nakvynė · pasirinktinai</span>
            <span className="block text-copy">Nameliuose visiems dalyviams, į sumą neįtraukta.</span>
          </span>
          <span className="shrink-0 font-bold tabular-nums">+{formatMoney({ min: CIONGO_OVERNIGHT_PER_PERSON.min * CIONGO_DEFAULT_PEOPLE, max: CIONGO_OVERNIGHT_PER_PERSON.max * CIONGO_DEFAULT_PEOPLE })}</span>
        </li>
      ) : null}
    </ul>
  );
}
