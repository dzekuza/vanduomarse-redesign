import { WavesIcon } from "@phosphor-icons/react";
import { FilterChip } from "@/components/events/filter-chip";
import { CONTACTS, MAIN_CONTACT } from "@/lib/contacts";
import type { SaunaPageData } from "@/lib/data/public-types";

export interface SaunaServiceVenue {
  id: string;
  label: string;
  /** The sauna has prices to book by the hour. */
  hasPrices: boolean;
  maxParty: number;
}

const SAUNA_CONTACT = CONTACTS.find(({ name }) => name === "Pirtis Marse") ?? MAIN_CONTACT;

/** The active saunas from the admin, in display order; a private booking is by the hour (2-4 h) with an optional pirtininkas. */
export function saunaServiceVenues(data: SaunaPageData): SaunaServiceVenue[] {
  return data.saunas.filter(({ active }) => active).map(({ id, name, rates }) => ({
    id,
    label: name,
    maxParty: rates.maxParty,
    hasPrices: Object.keys(rates.weekdayPrices).length + Object.keys(rates.weekendPrices).length > 0,
  }));
}

interface SaunaServicePrivateOptionsProps {
  venues: SaunaServiceVenue[];
  venueId?: string | null;
  onVenue: (id: string) => void;
  disabled?: boolean;
}

const CHOICE = "min-h-16 min-w-0 flex-col items-start justify-center gap-1 px-3 py-2 text-left";

/** Shown after "Privati pirtis": the admin's saunas (Pirties tipas), or a contact line for a sauna with no prices. */
export function SaunaServicePrivateOptions({ venues, venueId, onVenue, disabled }: SaunaServicePrivateOptionsProps) {
  const venue = venues.find(({ id }) => id === venueId);

  return (
    <div className="space-y-5">
      <fieldset disabled={disabled}>
        <legend className="mb-3 flex items-center gap-2 text-sm font-bold">
          <WavesIcon size={18} aria-hidden /> Pirtis
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {venues.map(({ id, label, maxParty }) => (
            <FilterChip key={id} active={id === venueId} onClick={() => onVenue(id)} className={CHOICE}>
              <span className="font-bold">{label}</span>
              <span className={id === venueId ? "text-dust/80" : "text-copy"}>Iki {maxParty} žmonių</span>
            </FilterChip>
          ))}
        </div>
      </fieldset>
      {venue && !venue.hasPrices ? (
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
