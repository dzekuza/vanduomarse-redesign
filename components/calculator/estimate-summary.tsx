import { WarningIcon } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import { InquiryForm } from "./inquiry-form";
import { formatMoney, type Estimate, type EstimateInput, type EstimateLine, type Money } from "@/lib/event-pricing";

const GROUPS: EstimateLine["group"][] = ["Erdvė", "Maistas ir gėrimai", "Paslaugos", "Pramogos", "Nakvynė"];

interface EstimateSummaryProps {
  estimate: Estimate;
  input: EstimateInput;
  guests: number;
  spaceLabel: string;
  compact?: boolean;
  /** Typical per-guest range from the price sheet for the chosen event type. */
  typical: { label: string; perGuest: Money } | null;
}

/** Boxed surface shared by the full summary and the breakdown-only variant. */
function EstimateFrame({ children }: { children: ReactNode }) {
  return <div className="border border-line bg-foam/15">{children}</div>;
}

/** Total, per-guest and typical-range header. */
function EstimateTotal({ estimate, guests, typical }: Pick<EstimateSummaryProps, "estimate" | "guests" | "typical">) {
  return (
    <div className="border-b border-line px-6 py-5">
      <p className="text-micro uppercase text-copy">Preliminari kaina</p>
      <p className="font-display mt-1 text-total font-bold">{formatMoney(estimate.total)}</p>
      {estimate.perGuest ? (
        <p className="mt-1 text-sm text-copy">
          ≈ {formatMoney(estimate.perGuest)} vienam svečiui · {guests} asm.
        </p>
      ) : null}
      {typical ? (
        <p className="mt-2 text-xs text-copy">
          {typical.label}: įprastai {formatMoney(typical.perGuest)} / asm.
        </p>
      ) : null}
    </div>
  );
}

/** Live breakdown of the estimate with its total header, grouped like the price sheet, with an inquiry CTA. */
export function EstimateSummary(props: EstimateSummaryProps) {
  return (
    <EstimateFrame>
      <EstimateTotal estimate={props.estimate} guests={props.guests} typical={props.typical} />
      <EstimateBody {...props} />
    </EstimateFrame>
  );
}

/** The breakdown without the total header, for surfaces that already show the total (the home page drawer). */
export function EstimateBreakdown(props: EstimateSummaryProps) {
  return (
    <EstimateFrame>
      <EstimateBody {...props} />
    </EstimateFrame>
  );
}

function EstimateBody({ estimate, input, guests, spaceLabel, typical, compact = false }: EstimateSummaryProps) {
  const padding = compact ? "p-3" : "px-6 py-5";
  return (
    <>
      <div className={`space-y-5 ${padding}`}>
        {estimate.lines.length === 0 ? <p className="text-xs text-copy">Pasirink renginio tipą ar erdvę, ir čia matysi preliminarią sąmatą.</p> : null}
        {GROUPS.map((group) => {
          const lines = estimate.lines.filter((l) => l.group === group);
          if (!lines.length) return null;
          return (
            <dl key={group}>
              <dt className="mb-2 text-micro font-bold uppercase text-ink">{group}</dt>
              {lines.map((l) => (
                <dd key={l.label} className="flex items-baseline justify-between gap-4 border-b border-line py-2 text-xs last:border-0">
                  <span className="text-ink/80">{l.label}</span>
                  <span className="shrink-0 font-bold tabular-nums">{formatMoney(l.amount)}</span>
                </dd>
              ))}
            </dl>
          );
        })}
      </div>

      {estimate.warnings.length ? (
        <ul className={`space-y-1.5 border-t border-line ${compact ? "p-3" : "px-6 py-4"}`}>
          {estimate.warnings.map((w) => (
            <li key={w} className="flex gap-2 text-xs text-ink/80">
              <WarningIcon size={14} className="mt-px shrink-0 text-rust" />
              {w}
            </li>
          ))}
        </ul>
      ) : null}

      <div className={`space-y-3 border-t border-line ${padding}`}>
        <p className="text-xs text-copy">
          Kainos su 21% PVM, galioja iki 2027-12-31. Erdvei taikomas 100% avansas, galutinis meniu tvirtinamas prieš 14 d.
          Tai orientacinė sąmata, ne pasiūlymas.
        </p>
        {input.space && input.day ? (
          <InquiryForm estimate={estimate} input={input} guests={guests} eventLabel={typical?.label ?? "Renginys"} spaceLabel={spaceLabel} />
        ) : (
          <p className="text-xs text-copy">Pasirink erdvę ir dieną, kad galėtum siųsti užklausą.</p>
        )}
      </div>
    </>
  );
}
