"use client";

import { OptionGroupLabel } from "@/components/reservation/option-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CompactStepper } from "@/components/booking/stepper";
import { programHours, type SaunaPick } from "@/lib/event-pricing";
import { formatHour, sessionPrice, type Sauna } from "@/lib/sauna";
import { durationLabel, programTotal, type SaunaProgram } from "@/lib/sauna-programs";
import { UPSELL_UNIT_SHORT, upsellMax, upsellTotal, type Upsell } from "@/lib/sauna-upsells";
import { CalculatorQuantityCard } from "./calculator-option-card";
import { OptionToggle } from "./option-toggle";

interface CalculatorSaunaCardProps {
  sauna: Sauna;
  guests: number;
  /** This sauna's private programs. */
  programs: readonly SaunaProgram[];
  /** Extras (priedai) this sauna offers. */
  upsells: readonly Upsell[];
  pick: SaunaPick | undefined;
  onChange: (pick: SaunaPick | null) => void;
}

/** Selectable option on the dark, selected card: light border, cream fill when chosen. */
function ProgramChoice({ primary, secondary, active, onClick }: { primary: string; secondary: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex min-h-11 flex-col items-start gap-0.5 border px-3 py-2 text-left text-xs transition-[color,background-color,border-color] duration-150 ease-out-strong ${
        active ? "border-dust bg-dust text-ink" : "border-line-on-ink text-dust hover:border-dust"
      }`}
    >
      <span className="font-bold">{primary}</span>
      <span className={active ? "text-ink/70" : "text-dust/80"}>{secondary}</span>
    </button>
  );
}

/** Every start that still lets `hours` finish before closing. */
const startOptions = ({ openHour, closeHour }: Sauna["rates"], hours: number) =>
  Array.from({ length: Math.max(0, closeHour - hours - openHour + 1) }, (_, i) => openHour + i);

/** One real sauna of the park: session length, start hour (needed to hold it) and the Pirtininkas add-on. */
export function CalculatorSaunaCard({ sauna, guests, programs, upsells, pick, onChange }: CalculatorSaunaCardProps) {
  const { rates } = sauna;
  const hours = pick?.hours ?? 0;
  const program = pick?.programId ? programs.find((p) => p.id === pick.programId) : undefined;
  const starts = startOptions(rates, Math.max(hours, rates.minHours));
  /** Switch between hourly pricing and a program; a program fixes the length, so a start that no longer fits is cleared. */
  const choose = (next: SaunaProgram | null) => {
    if (!pick) return;
    const nextHours = next ? programHours(next) : Math.max(rates.minHours, pick.hours);
    const startHour = pick.startHour !== null && pick.startHour + nextHours <= rates.closeHour ? pick.startHour : null;
    onChange({ hours: nextHours, startHour, extras: pick.extras, programId: next?.id ?? null });
  };

  return (
    <CalculatorQuantityCard
      eyebrow={`Iki ${rates.maxParty} asm.`}
      title={sauna.name}
      description={sauna.description || undefined}
      price={`Nuo ${sessionPrice(rates.minHours, guests, rates).toLocaleString("lt-LT")} €`}
      label="Valandos"
      value={hours}
      min={program ? programHours(program) : rates.minHours}
      max={program ? programHours(program) : rates.maxHours}
      onChange={(next) => {
        if (next <= 0) return onChange(null);
        // A longer session may no longer fit before closing: ask for the start again.
        const startHour = pick?.startHour != null && pick.startHour + next <= rates.closeHour ? pick.startHour : null;
        onChange({ hours: next, startHour, extras: pick?.extras ?? {}, programId: pick?.programId ?? null });
      }}
    >
      {pick ? (
        <>
          {programs.length > 0 ? (
            <fieldset className="basis-full space-y-2">
              <OptionGroupLabel>Programa</OptionGroupLabel>
              <div className="grid gap-2 sm:grid-cols-2">
                <ProgramChoice primary="Pagal valandas" secondary={`Nuo ${sessionPrice(rates.minHours, guests, rates).toLocaleString("lt-LT")} €`} active={!program} onClick={() => choose(null)} />
                {programs.map((p) => (
                  <ProgramChoice
                    key={p.id}
                    primary={p.name}
                    secondary={`${programTotal(p, guests, 0).toLocaleString("lt-LT")} € · ${durationLabel(p.durationMinutes)}`}
                    active={program?.id === p.id}
                    onClick={() => choose(p)}
                  />
                ))}
              </div>
            </fieldset>
          ) : null}
          <div className="min-w-0 space-y-2">
            <OptionGroupLabel>Pradžia</OptionGroupLabel>
            <Select
              value={pick.startHour === null ? "" : String(pick.startHour)}
              onValueChange={(value) => onChange({ ...pick, startHour: Number(value) })}
            >
              <SelectTrigger aria-label={`${sauna.name}: pradžios laikas`} className="min-h-11 w-32 rounded-none border-line bg-dust text-ink">
                <SelectValue placeholder="Pasirink" />
              </SelectTrigger>
              <SelectContent>
                {starts.map((hour) => (
                  <SelectItem key={hour} value={String(hour)}>
                    {formatHour(hour)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {upsells.length > 0 ? (
            <fieldset className="basis-full space-y-2">
              <OptionGroupLabel>Priedai</OptionGroupLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                {upsells.map((u) => {
                  const ctx = { partySize: guests, hours: program ? programHours(program) : Math.max(rates.minHours, pick.hours) };
                  const setExtra = (qty: number) => onChange({ ...pick, extras: { ...pick.extras, [u.id]: qty } });
                  return u.unit === "vienetui" ? (
                    <CompactStepper
                      key={u.id}
                      label={`${u.name} (+${u.price} ${UPSELL_UNIT_SHORT[u.unit]})`}
                      value={pick.extras[u.id] ?? 0}
                      onChange={setExtra}
                      min={0}
                      max={upsellMax(u, guests)}
                    />
                  ) : (
                    <div key={u.id} className="min-w-0 bg-dust">
                      <OptionToggle label={u.name} hint={`${u.description} +${upsellTotal(u, 1, ctx)} €`.trim()} checked={(pick.extras[u.id] ?? 0) > 0} onChange={(on) => setExtra(on ? 1 : 0)} />
                    </div>
                  );
                })}
              </div>
            </fieldset>
          ) : null}
          {pick.startHour === null ? <p className="basis-full text-xs text-copy">Pasirink pradžios laiką, kad priėmus užklausą pirtis būtų užimta.</p> : null}
        </>
      ) : null}
    </CalculatorQuantityCard>
  );
}
