"use client";

import { useState } from "react";
import { DEFAULT_INPUT, PRESETS, SPACES, dayTypeOf, estimate, type EstimateInput, type PresetId } from "@/lib/event-pricing";

/** State of the event price calculator: the input, a setter and the live estimate. Shared by the page and the drawer. */
export function useEventCalculator() {
  const [input, setInput] = useState<EstimateInput>(DEFAULT_INPUT);
  const set = <K extends keyof EstimateInput>(key: K, value: EstimateInput[K]) => setInput((s) => ({ ...s, [key]: value }));

  const result = estimate(input);
  const guests = input.adults + input.kids;
  const space = input.space ? SPACES.find((s) => s.id === input.space)! : null;
  const preset = PRESETS.find((p) => p.id === input.preset) ?? null;

  function applyPreset(id: PresetId) {
    const p = PRESETS.find((x) => x.id === id)!;
    // A date already chosen decides the kind of day; the preset's own guess only applies without one.
    setInput((s) => ({ ...DEFAULT_INPUT, ...p.apply, preset: id, date: s.date, day: s.date ? dayTypeOf(s.date) : (p.apply.day ?? null) }));
  }

  /** The event date also sets the kind of day (workday or evening / weekend); the day tiles can still change it. */
  function chooseDate(date: string) {
    setInput((s) => ({ ...s, date: date || null, day: date ? dayTypeOf(date) : s.day }));
  }

  return { input, set, result, guests, space, preset, applyPreset, chooseDate };
}

export type EventCalculatorState = ReturnType<typeof useEventCalculator>;
