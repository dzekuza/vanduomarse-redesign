"use client";

import { useState } from "react";
import type { CabinSize } from "@/lib/cabin";
import { DEFAULT_INPUT, PRESETS, SPACES, dayTypeOf, estimate, type EstimateInput, type PresetId } from "@/lib/event-pricing";
import { todayKey } from "@/lib/sauna";

/** State of the event price calculator: the input, a setter and the live estimate. Shared by the page and the drawer. */
export function useEventCalculator(today = todayKey()) {
  const [input, setInput] = useState<EstimateInput>(DEFAULT_INPUT);
  const set = <K extends keyof EstimateInput>(key: K, value: EstimateInput[K]) => setInput((s) => ({ ...s, [key]: value }));

  function setCabinUnits(size: CabinSize, count: number) {
    setInput((s) => ({ ...s, cabinUnits: { ...s.cabinUnits, [size]: count } }));
  }

  const result = estimate(input);
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

  return { input, set, setCabinUnits, result, guests, space, preset, applyPreset, chooseDate, today };
}

export type EventCalculatorState = ReturnType<typeof useEventCalculator>;
