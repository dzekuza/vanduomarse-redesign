import { UsersThreeIcon, WavesIcon } from "@phosphor-icons/react";
import { FilterChip } from "@/components/events/filter-chip";
import { CONTACTS, MAIN_CONTACT } from "@/lib/contacts";
import type { SaunaPageData } from "@/lib/data/public-types";
import { slugify } from "@/lib/sauna";
import { programPriceLine, type SaunaProgram } from "@/lib/sauna-programs";

interface SaunaServiceVenue {
  id: string;
  label: string;
  programs: SaunaProgram[];
  maxParty: number;
  comingSoon?: boolean;
}

const SAUNA_CONTACT = CONTACTS.find(({ name }) => name === "Pirtis Marse") ?? MAIN_CONTACT;
const FINNISH_SAUNA = /(?:^|-)(?:suomisk\w*|suomiu|finnish)(?:-|$)/;
const WOOD_SAUNA = /(?:^|-)malkin\w*(?:-|$)/;

const PROGRAM_LABELS: Record<string, string> = {
  "pirtis-tik-jusu-kompanijai": "Be pirtininko",
  "privati-pirtis-su-programa": "Su pirtininku",
};

export function saunaServiceVenues(data: SaunaPageData): SaunaServiceVenue[] {
  const venues: SaunaServiceVenue[] = data.saunas.filter(({ active }) => active).map(({ id, name, rates }) => ({
    id,
    label: name,
    maxParty: rates.maxParty,
    programs: data.programs.filter((program) => program.active && program.kind === "private" && program.saunaId === id),
  }));
  const matches = (pattern: RegExp) => ({ id, label }: SaunaServiceVenue) => pattern.test(slugify(id)) || pattern.test(slugify(label));
  const finnish = venues.find(({ id }) => id === "pirtis-marse") ?? venues.find(matches(FINNISH_SAUNA));
  const isWood = matches(WOOD_SAUNA);
  const wood = venues.find((venue) => venue !== finnish && isWood(venue));
  return [
    finnish ?? { id: "suomiska-sauna", label: "Suomiška sauna", maxParty: 20, programs: [] },
    wood ?? { id: "malkine-pirtis", label: "Malkinė pirtis", maxParty: 25, programs: [], comingSoon: true },
    ...venues.filter((venue) => venue !== finnish && venue !== wood),
  ];
}

interface SaunaServicePrivateOptionsProps {
  venues: SaunaServiceVenue[];
  venueId?: string | null;
  programId?: string | null;
  onVenue: (id: string) => void;
  onProgram: (id: string) => void;
  disabled?: boolean;
}

const CHOICE = "min-h-16 min-w-0 flex-col items-start justify-center gap-1 px-3 py-2 text-left";

/** Private options follow the sauna each published program reserves. */
export function SaunaServicePrivateOptions({ venues, venueId, programId, onVenue, onProgram, disabled }: SaunaServicePrivateOptionsProps) {
  const venue = venues.find(({ id }) => id === venueId);

  return (
    <div className="space-y-5">
      <fieldset disabled={disabled}>
        <legend className="mb-3 flex items-center gap-2 text-sm font-bold">
          <WavesIcon size={18} aria-hidden /> Pirtis
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {venues.map(({ id, label, programs, maxParty, comingSoon }) => (
            <FilterChip key={id} active={id === venueId} disabled={comingSoon} onClick={() => onVenue(id)} className={comingSoon ? `${CHOICE} border-dashed bg-ink/5 text-copy` : CHOICE}>
              <span className="font-bold">{label}</span>
              <span className={id === venueId ? "text-dust/80" : "text-copy"}>Iki {maxParty} žmonių</span>
              {comingSoon ? <span className="font-medium text-copy">Netrukus atsidarys</span>
                : !programs.length ? <span className={id === venueId ? "text-dust/80" : "text-copy"}>Pagal užklausą</span> : null}
            </FilterChip>
          ))}
        </div>
      </fieldset>
      {venue?.programs.length ? (
        <fieldset disabled={disabled}>
          <legend className="mb-3 flex items-center gap-2 text-sm font-bold">
            <UsersThreeIcon size={18} aria-hidden /> Pirtininkas
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {venue.programs.map((program) => (
              <FilterChip key={program.id} active={program.id === programId} onClick={() => { if (program.id !== programId) onProgram(program.id); }} className={CHOICE}>
                <span className="font-bold">{PROGRAM_LABELS[program.id] ?? program.name}</span>
                <span className={program.id === programId ? "text-dust/80" : "text-copy"}>{programPriceLine(program)}</span>
                {program.capacity && venue.maxParty ? <span className={program.id === programId ? "text-dust/80" : "text-copy"}>Iki {Math.min(program.capacity, venue.maxParty)} asm.</span> : null}
              </FilterChip>
            ))}
          </div>
        </fieldset>
      ) : venue ? (
        <div className="space-y-1 border-t border-line pt-3">
          <p className="text-xs leading-relaxed text-copy">Dėl šios pirties laisvų laikų ir kainos susisiek su komanda.</p>
          <a href={`mailto:${SAUNA_CONTACT.email}`} className="inline-flex min-h-11 items-center text-xs font-bold underline underline-offset-4 hover:text-rust">
            {SAUNA_CONTACT.email}
          </a>
        </div>
      ) : null}
    </div>
  );
}
