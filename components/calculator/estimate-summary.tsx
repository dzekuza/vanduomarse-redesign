import { WarningIcon } from "@phosphor-icons/react/dist/ssr";
import { InquiryForm } from "./inquiry-form";
import { formatMoney, type Estimate, type EstimateInput, type EstimateLine, type Money } from "@/lib/event-pricing";

const GROUPS: EstimateLine["group"][] = ["Erdvė", "Maistas ir gėrimai", "Paslaugos", "Pramogos", "Nakvynė"];

interface EstimateSummaryProps {
  estimate: Estimate;
  input: EstimateInput;
  guests: number;
  spaceLabel: string;
  /** Typical per-guest range from the price sheet for the chosen event type. */
  typical: { label: string; perGuest: Money } | null;
  /** The drawer shows the total in its own header, so it can drop the one here. */
  showTotal?: boolean;
}

/** Live breakdown of the estimate, grouped like the price sheet, with an inquiry CTA. */
export function EstimateSummary({ estimate, input, guests, spaceLabel, typical, showTotal = true }: EstimateSummaryProps) {
  return (
    <div className="border border-line bg-foam/15">
      {showTotal ? (
      <div className="border-b border-line px-6 py-5">
        <p className="text-micro uppercase text-ink/70">Preliminari kaina</p>
        <p className="font-display mt-1 text-3xl font-bold">{formatMoney(estimate.total)}</p>
        {estimate.perGuest ? (
          <p className="mt-1 text-sm text-ink/70">
            ≈ {formatMoney(estimate.perGuest)} vienam svečiui · {guests} asm.
          </p>
        ) : null}
        {typical ? (
          <p className="mt-2 text-xs text-ink/60">
            {typical.label}: įprastai {formatMoney(typical.perGuest)} / asm.
          </p>
        ) : null}
      </div>
      ) : null}

      <div className="space-y-5 px-6 py-5">
        {estimate.lines.length === 0 ? <p className="text-xs text-ink/65">Pasirink renginio tipą ar erdvę, ir čia matysi preliminarią sąmatą.</p> : null}
        {GROUPS.map((group) => {
          const lines = estimate.lines.filter((l) => l.group === group);
          if (!lines.length) return null;
          return (
            <dl key={group}>
              <dt className="mb-2 text-micro uppercase text-ink/70">{group}</dt>
              {lines.map((l) => (
                <dd key={l.label} className="flex items-baseline justify-between gap-4 border-b border-line py-2 text-xs last:border-0">
                  <span className="text-ink/80">{l.label}</span>
                  <span className="shrink-0 tabular-nums">{formatMoney(l.amount)}</span>
                </dd>
              ))}
            </dl>
          );
        })}
      </div>

      {estimate.warnings.length ? (
        <ul className="space-y-1.5 border-t border-line px-6 py-4">
          {estimate.warnings.map((w) => (
            <li key={w} className="flex gap-2 text-xs text-ink/80">
              <WarningIcon size={14} className="mt-px shrink-0 text-rust" />
              {w}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="space-y-3 border-t border-line px-6 py-5">
        <p className="text-xs text-ink/60">
          Kainos su 21% PVM, galioja iki 2027-12-31. Erdvei taikomas 100% avansas, galutinis meniu tvirtinamas prieš 14 d.
          Tai orientacinė sąmata, ne pasiūlymas.
        </p>
        {input.space && input.day ? (
          <InquiryForm estimate={estimate} input={input} guests={guests} eventLabel={typical?.label ?? "Renginys"} spaceLabel={spaceLabel} />
        ) : (
          <p className="text-xs text-rust">Pasirink erdvę ir dieną, kad galėtum siųsti užklausą.</p>
        )}
      </div>
    </div>
  );
}
