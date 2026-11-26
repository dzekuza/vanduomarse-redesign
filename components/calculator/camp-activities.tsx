"use client";

import { CalendarBlankIcon, FireIcon, SparkleIcon } from "@phosphor-icons/react";
import { ChoiceTile } from "@/components/booking/choice-tile";
import { FieldHeading } from "@/components/booking/field-heading";
import { CAMP_ACTIVITIES, CAMP_DAY_LABEL, type CampActivityId, type CampDay } from "@/lib/event-pricing";
import { OptionToggle } from "./option-toggle";
import { SaunaAndQuadCards } from "./stay-section";
import type { EventCalculatorState } from "./use-event-calculator";

const DAYS: CampDay[] = ["sat", "sun"];

/** Camp activities: a list to tick (priced by agreement), then the sauna (with its days) and the quads, which have prices. */
export function CampActivities({ calc }: { calc: EventCalculatorState }) {
  const { input, set } = calc;
  const toggle = <T extends string>(list: T[], item: T) => (list.includes(item) ? list.filter((current) => current !== item) : [...list, item]);
  const saunaChosen = Object.values(input.saunas).some((pick) => pick.hours > 0);

  return (
    <div className="space-y-8">
      <div>
        <FieldHeading icon={SparkleIcon}>Veiklos (kaina aptariama)</FieldHeading>
        <div className="grid gap-2 lg:grid-cols-2">
          {CAMP_ACTIVITIES.map((activity) => (
            <OptionToggle
              key={activity.id}
              label={activity.label}
              hint="Kainą suderinsime su komanda"
              checked={input.campActivities.includes(activity.id)}
              onChange={() => set("campActivities", toggle<CampActivityId>(input.campActivities, activity.id))}
            />
          ))}
        </div>
      </div>
      <div>
        <FieldHeading icon={FireIcon}>Pirtis ir keturračiai</FieldHeading>
        <div className="grid gap-3 lg:grid-cols-2">
          <SaunaAndQuadCards calc={calc} />
        </div>
        {saunaChosen ? (
          <fieldset className="mt-4">
            <FieldHeading as="legend" icon={CalendarBlankIcon} className="mb-2">Pirties dienos (gali rinktis abi)</FieldHeading>
            <div className="grid grid-cols-2 gap-2">
              {DAYS.map((day) => (
                <ChoiceTile
                  key={day}
                  primary={CAMP_DAY_LABEL[day]}
                  secondary={input.campSaunaDays.includes(day) ? "Pasirinkta" : "Pridėti"}
                  active={input.campSaunaDays.includes(day)}
                  onClick={() => set("campSaunaDays", toggle<CampDay>(input.campSaunaDays, day))}
                />
              ))}
            </div>
          </fieldset>
        ) : null}
      </div>
    </div>
  );
}
