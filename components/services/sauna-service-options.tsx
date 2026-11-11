import { UsersThreeIcon, WavesIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { FilterChip } from "@/components/events/filter-chip";
import type { SaunaPageData } from "@/lib/data/public-types";
import type { SaunaHireTariff } from "@/lib/sauna-hire";
import { slugify } from "@/lib/sauna";
import { programPriceLine, type SaunaProgram } from "@/lib/sauna-programs";

interface SaunaServiceVenue {
  id: string;
  label: string;
  programs: SaunaProgram[];
  maxParty: number;
  comingSoon?: boolean;
  tariff?: SaunaHireTariff;
}

const FINNISH_SAUNA = /(?:^|-)(?:suomisk\w*|suomiu|finnish)(?:-|$)/;
const WOOD_SAUNA = /(?:^|-)malkin\w*(?:-|$)/;

const LEGACY_UNHOSTED_PROGRAMS = ["privati-pirtis", "pirtis-tik-jusu-kompanijai"];

export function unhostedSaunaProgram(venue?: SaunaServiceVenue) {
  return venue?.programs.find(({ id }) => id === venue.tariff?.unhostedProgram)
    ?? venue?.programs.find(({ id }) => LEGACY_UNHOSTED_PROGRAMS.includes(id));
}

export function saunaServiceVenues(data: SaunaPageData): SaunaServiceVenue[] {
  const venues: SaunaServiceVenue[] = data.saunas.filter(({ active }) => active).map(({ id, name, rates, hireTariff }) => ({
    id,
    label: name,
    maxParty: rates.maxParty,
    tariff: hireTariff,
    programs: data.programs.filter((program) => program.active && program.kind === "private" && program.saunaId === id
      && (!hireTariff || [hireTariff.hostedProgram, hireTariff.unhostedProgram].includes(program.id))),
  }));
  const matches = (pattern: RegExp) => ({ id, label }: SaunaServiceVenue) => pattern.test(slugify(id)) || pattern.test(slugify(label));
  const isFinnish = matches(FINNISH_SAUNA);
  const isWood = matches(WOOD_SAUNA);
  // The existing private programs and occupancy belong to the Finnish sauna under this legacy ID.
  const finnish = venues.find((venue) => isFinnish(venue) && venue.programs.length)
    ?? venues.find(({ id }) => id === "pirtis-marse")
    ?? venues.find(isFinnish);
  return [
    ...(finnish ? [{ ...finnish, label: "Suomiška sauna" }] : []),
    { id: "malkine-pirtis", label: "Malkinė pirtis", maxParty: 25, programs: [], comingSoon: true },
    ...venues.filter((venue) => venue !== finnish && !isFinnish(venue) && !isWood(venue)),
  ];
}

interface SaunaServicePrivateOptionsProps {
  venues: SaunaServiceVenue[];
  venueId?: string | null;
  programId?: string | null;
  durationField?: ReactNode;
  onVenue: (id: string) => void;
  onProgram: (id: string) => void;
  disabled?: boolean;
}

const CHOICE = "min-h-16 min-w-0 flex-col items-start justify-center gap-1 px-3 py-2 text-left";

/** Private options follow the sauna each published program reserves. */
export function SaunaServicePrivateOptions({ venues, venueId, programId, durationField, onVenue, onProgram, disabled }: SaunaServicePrivateOptionsProps) {
  const venue = venues.find(({ id }) => id === venueId);
  const unhosted = unhostedSaunaProgram(venue);
  const programs = unhosted && venue
    ? [unhosted, ...venue.programs.filter(({ id }) => id !== unhosted.id)]
    : venue?.programs ?? [];

  return (
    <div className="space-y-5">
      <fieldset disabled={disabled} className="disabled:opacity-50">
        <legend className="mb-3 flex items-center gap-2 text-sm font-bold">
          <WavesIcon size={18} aria-hidden /> Pirtis
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {venues.map(({ id, label, programs, maxParty, comingSoon }) => (
            <FilterChip key={id} active={id === venueId} disabled={!programs.length} onClick={() => onVenue(id)} className={!programs.length ? `${CHOICE} border-dashed bg-ink/5 text-copy` : CHOICE}>
              <span className="font-bold">{label}</span>
              <span className={id === venueId ? "text-dust/80" : "text-copy"}>Iki {maxParty} žmonių</span>
              {comingSoon ? <span className="font-medium text-copy">Netrukus atsidarys</span>
                : !programs.length ? <span className="text-copy">Rezervacija negalima</span> : null}
            </FilterChip>
          ))}
        </div>
      </fieldset>
      {durationField}
      {venue && programs.length ? (
        <fieldset disabled={disabled}>
          <legend className="mb-3 flex items-center gap-2 text-sm font-bold">
            <UsersThreeIcon size={18} aria-hidden /> Pirtininkas
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {programs.map((program) => (
              <FilterChip key={program.id} active={program.id === programId} onClick={() => { if (program.id !== programId) onProgram(program.id); }} className={CHOICE}>
                <span className="font-bold">{program.id === unhosted?.id || LEGACY_UNHOSTED_PROGRAMS.includes(program.id) ? "Be pirtininko"
                  : program.id === (venue.tariff?.hostedProgram ?? "privati-pirtis-su-programa") ? "Su pirtininku" : program.name}</span>
                <span className={program.id === programId ? "text-dust/80" : "text-copy"}>{venue.tariff ? (program.id === venue.tariff.hostedProgram ? `+${venue.tariff.hostPrice} €` : "0 €") : programPriceLine(program)}</span>
                {!venue.tariff && program.capacity && venue.maxParty ? <span className={program.id === programId ? "text-dust/80" : "text-copy"}>Iki {Math.min(program.capacity, venue.maxParty)} asm.</span> : null}
              </FilterChip>
            ))}
          </div>
          {venue.tariff && programs.some(({ id }) => id === venue.tariff?.hostedProgram) ? (
            <p className="mt-2 text-xs text-copy">Su pirtininku pirtis rezervuojama bent 3 val.</p>
          ) : null}
        </fieldset>
      ) : null}
    </div>
  );
}
