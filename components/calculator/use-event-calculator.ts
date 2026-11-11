"use client";

import { useState } from "react";
import { DEFAULT_INPUT, EMPTY_CATALOG, PRESETS, SPACES, dayTypeOf, estimate, type CalculatorCatalog, type EstimateInput, type PresetId, type SaunaPick } from "@/lib/event-pricing";
import { todayKey } from "@/lib/sauna";

/**
 * State of the event price calculator: the input, setters and the live estimate. Shared by the page and the drawer.
 * `catalog` holds the live cabin sizes and saunas with their prices (from `public.stay_types` and `public.saunas`).
 */
export function useEventCalculator(today = todayKey(), catalog: CalculatorCatalog = EMPTY_CATALOG) {
  const [input, setInput] = useState<EstimateInput>(DEFAULT_INPUT);
  const set = <K extends keyof EstimateInput>(key: K, value: EstimateInput[K]) => setInput((s) => ({ ...s, [key]: value }));

  function setCabinUnits(typeId: string, count: number) {
    setInput((s) => ({ ...s, cabinUnits: { ...s.cabinUnits, [typeId]: count } }));
  }

  /** Add, change or (with null) remove one sauna of the quote. */
  function setSauna(id: string, pick: SaunaPick | null) {
    setInput((s) => {
      const saunas = { ...s.saunas };
      if (pick) saunas[id] = pick;
      else delete saunas[id];
      return { ...s, saunas };
    });
  }

  const result = estimate(input, catalog);
  const guests = input.adults + input.kids;
  const space = input.space ? SPACES.find((s) => s.id === input.space)! : null;
  const preset = PRESETS.find((p) => p.id === input.preset) ?? null;

  function applyPreset(id: PresetId) {
    const p = PRESETS.find((x) => x.id === id)!;
    // The type only suggests a group size (and drives the typical price per guest); nothing else is chosen for the visitor.
    setInput((s) => ({ ...s, preset: id, adults: p.apply.adults ?? DEFAULT_INPUT.adults, kids: p.apply.kids ?? DEFAULT_INPUT.kids }));
  }

  /** The event date also sets the kind of day (workday or evening / weekend); the day tiles can still change it. */
  function chooseDate(date: string) {
    setInput((s) => ({ ...s, date: date || null, day: date ? dayTypeOf(date) : s.day }));
  }

  return { input, set, setCabinUnits, setSauna, catalog, stayTypes: catalog.stayTypes, result, guests, space, preset, applyPreset, chooseDate, today };
}

export type EventCalculatorState = ReturnType<typeof useEventCalculator>;
