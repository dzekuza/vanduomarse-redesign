"use client";

import { BuildingsIcon } from "@phosphor-icons/react";
import { ChoiceTile } from "@/components/booking/choice-tile";
import { FieldHeading } from "@/components/booking/field-heading";
import { SPACES, VENUES, WHOLE_PARK, type DayType, type SpaceId, type Venue } from "@/lib/event-pricing";
import { VenueCard } from "./venue-card";

interface SpacePickerProps {
  selected: SpaceId[];
  day: DayType | null;
  guests: number;
  camp?: boolean;
  onChange: (spaces: SpaceId[]) => void;
}

const VARIANT_LABEL: Partial<Record<SpaceId, string>> = {
  "kupolas-svente": "Šventė",
  "kupolas-seminaras": "Seminaras (I–V)",
  parkas: "Be WAKE",
  "parkas-wake": "Su WAKE",
};

const spaceOf = (id: SpaceId) => SPACES.find((space) => space.id === id)!;

/**
 * The venues to hire, several at once (their rents add up). Kupolas has a variant (party or seminar); the whole park
 * replaces the single venues, so picking it clears them and picking a venue clears it.
 */
export function SpacePicker({ selected, day, guests, camp, onChange }: SpacePickerProps) {
  const active = (venue: Venue) => venue.spaces.find((id) => selected.includes(id));
  const toggle = (venue: Venue) => {
    if (active(venue)) onChange(selected.filter((id) => !venue.spaces.includes(id)));
    else if (venue.id === WHOLE_PARK.id) onChange([venue.spaces[0]]);
    else onChange([...selected.filter((id) => !WHOLE_PARK.spaces.includes(id)), venue.spaces[0]]);
  };
  const switchVariant = (venue: Venue, id: SpaceId) => onChange(selected.map((current) => (venue.spaces.includes(current) ? id : current)));
  const variantVenues = [...VENUES, WHOLE_PARK].filter((venue) => venue.spaces.length > 1 && active(venue));

  return (
    <div className="space-y-3">
      <p className="text-xs text-copy">Gali rinktis kelias erdves, jų kainos susideda.</p>
      <div className="grid gap-2">
        {VENUES.map((venue) => (
          <VenueCard key={venue.id} label={venue.label} space={spaceOf(active(venue) ?? venue.spaces[0])} day={day} guests={guests} camp={camp} selected={Boolean(active(venue))} onToggle={() => toggle(venue)} />
        ))}
        <VenueCard
          label={WHOLE_PARK.label}
          space={spaceOf(active(WHOLE_PARK) ?? WHOLE_PARK.spaces[0])}
          day={day}
          guests={guests}
          camp={camp}
          selected={Boolean(active(WHOLE_PARK))}
          onToggle={() => toggle(WHOLE_PARK)}
        />
      </div>
      {variantVenues.map((venue) => (
        <fieldset key={venue.id}>
          <FieldHeading as="legend" icon={BuildingsIcon} className="mb-2">{venue.label}</FieldHeading>
          <div className="grid grid-cols-2 gap-2">
            {venue.spaces.map((id) => (
              <ChoiceTile key={id} primary={VARIANT_LABEL[id] ?? spaceOf(id).label} secondary={spaceOf(id).includedTime} active={active(venue) === id} onClick={() => switchVariant(venue, id)} />
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
