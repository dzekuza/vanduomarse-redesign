"use client";

import { useState } from "react";
import { DEFAULT_INPUT, PRESETS, SPACES, estimate, type EstimateInput, type PresetId } from "@/lib/event-pricing";

/** State of the event price calculator: the input, a setter and the live estimate. Shared by the page and the drawer. */
export function useEventCalculator() {
  const [input, setInput] = useState<EstimateInput>(DEFAULT_INPUT);
  const set = <K extends keyof EstimateInput>(key: K, value: EstimateInput[K]) => setInput((s) => ({ ...s, [key]: value }));

  const result = estimate(input);
  const guests = input.adults + input.kids;
  const space = SPACES.find((s) => s.id === input.space)!;
  const preset = PRESETS.find((p) => p.id === input.preset) ?? null;

  function applyPreset(id: PresetId) {
    const p = PRESETS.find((x) => x.id === id)!;
    setInput({ ...DEFAULT_INPUT, ...p.apply, preset: id });
  }

  return { input, set, result, guests, space, preset, applyPreset };
}

export type EventCalculatorState = ReturnType<typeof useEventCalculator>;
