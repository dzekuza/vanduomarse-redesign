import type { Dispatch, SetStateAction } from "react";
import { MAX_STAY_UNITS } from "@/lib/cabin";
import { freeAt, quadRentalUnitLimit } from "@/lib/quads";
import { MAX_PEOPLE, planHours, type ActivityId, type Picks, type Plans, type ReservationData, type When } from "@/lib/reservation";

interface PlanQuantity {
  id: string;
  label: string;
  value: number;
  /** Defaults to 1; a quad tour needs its route's minimum. */
  min?: number;
  max: number;
  onChange: (value: number) => void;
}

export type PlanQuantities = Partial<Record<ActivityId, PlanQuantity[]>>;

/** Edit the picks behind the summary using the limits of the selected booking. */
export function planQuantities(
  { pirtis, keturraciai, nakvyne }: Plans,
  data: ReservationData,
  { day, people }: When,
  setPicks: Dispatch<SetStateAction<Picks>>,
  setPeople: (people: number) => void,
): PlanQuantities {
  const quantities: PlanQuantities = {};

  if (pirtis && pirtis.mode !== "private") {
    const capacity = pirtis.mode === "hourly"
      ? pirtis.sauna.rates.maxParty
      : pirtis.session?.spotsLeft ?? 0;
    if (capacity > 0) {
      quantities.pirtis = [{ id: "people", label: "Žmonės pirtyje", value: people, max: Math.min(MAX_PEOPLE, capacity), onChange: setPeople }];
    }
  }

  if (keturraciai) {
    const hours = keturraciai.ok ? planHours(keturraciai) : [];
    quantities.keturraciai = keturraciai.items.map<PlanQuantity>(({ type, units }) => ({
      id: type.id,
      label: type.name,
      value: units,
      max: Math.min(
        quadRentalUnitLimit(type, keturraciai.units - units),
        ...hours.map((hour) => freeAt(type, data.quads.taken, day, hour)),
      ),
      onChange: (value) => setPicks((picks) => {
        const pick = picks.keturraciai;
        if (!pick?.quantities[type.id]) return picks;
        return {
          ...picks,
          keturraciai: {
            ...pick,
            hours: keturraciai.ok ? keturraciai.hours : pick.hours,
            quantities: { ...pick.quantities, [type.id]: value },
          },
        };
      }),
    })).filter(({ max }) => max > 0);
  }

  if (nakvyne?.type) {
    const max = Math.min(MAX_STAY_UNITS, nakvyne.free(nakvyne.type));
    if (max > 0) {
      quantities.nakvyne = [{
        id: "stay",
        label: nakvyne.type.label,
        value: nakvyne.units,
        max,
        onChange: (units) => setPicks((picks) => picks.nakvyne ? { ...picks, nakvyne: { ...picks.nakvyne, units } } : picks),
      }];
    }
  }

  return quantities;
}
