"use client";

import { useState } from "react";
import { DEFAULT_INPUT, EMPTY_CATALOG, PRESETS, SPACES, dayTypeOf, estimate, type CalculatorCatalog, type EstimateInput, type EventTime, type PresetId, type SaunaPick } from "@/lib/event-pricing";
import { MAX_STAY_NIGHTS, stayTypesOf } from "@/lib/cabin";
import { todayKey } from "@/lib/sauna";
import { stayFitDetails, type StayAvailability } from "./stay-fit-details";

/**
 * State of the event price calculator: the input, setters and the live estimate. Shared by the page and the drawer.
 * `catalog` holds the live cabin sizes and saunas with their prices (from `public.stay_types` and `public.saunas`).
 */
/** Largest group the slider offers for any event. */
const MAX_GUESTS = 500;

export function useEventCalculator(today = todayKey(), catalog: CalculatorCatalog = EMPTY_CATALOG, stay?: StayAvailability) {
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
  const spaces = SPACES.filter((s) => input.spaces.includes(s.id));
  const spaceLabel = spaces.map((s) => s.label).join(" + ");
  const extraHour = spaces.find((s) => s.extraHour)?.extraHour ?? null;
  const preset = PRESETS.find((p) => p.id === input.preset) ?? null;
  // A camp sleeps in the cabins, so its group cannot be larger than the beds (camper pitches are not counted: they are not used for camps).
  const sleepingPlaces = stayTypesOf(catalog.stayTypes, "namelis").filter((t) => t.active && t.units !== null).reduce((sum, t) => sum + (t.units ?? 0) * t.maxGuests, 0);
  const guestLimit = input.preset === "stovykla" && sleepingPlaces > 0 ? sleepingPlaces : MAX_GUESTS;

  function applyPreset(id: PresetId) {
    const p = PRESETS.find((x) => x.id === id)!;
    // The type only suggests a group size (and drives the typical price per guest); nothing else is chosen for the visitor.
    const suggestedGuests = (p.apply.adults ?? DEFAULT_INPUT.adults) + (p.apply.kids ?? DEFAULT_INPUT.kids);
    // A group size the visitor already chose (the standalone page asks for it first) is never overwritten.
    // A camp almost always uses the dome, so it starts chosen (the visitor can switch it off).
    const limit = id === "stovykla" && sleepingPlaces > 0 ? sleepingPlaces : MAX_GUESTS;
    setInput((s) => {
      const adults = s.adults === DEFAULT_INPUT.adults && s.kids === DEFAULT_INPUT.kids ? suggestedGuests : s.adults;
      return { ...s, spaces: id === "stovykla" && s.spaces.length === 0 ? ["kupolas-svente"] : s.spaces, preset: id, adults: Math.max(1, Math.min(adults, limit - s.kids)) };
    });
  }

  /** Days between two yyyy-mm-dd dates. */
  const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

  /** The last day of a multi-day event: a camp lasts nights + 1 days and the cabins are wanted for the nights. */
  function chooseEnd(end: string | null) {
    setInput((s) => {
      if (!s.date || !end || end <= s.date) return { ...s, endDate: null, campDays: 1 };
      const nights = daysBetween(s.date, end);
      return { ...s, endDate: end, campDays: nights + 1, cabinNights: Math.max(1, Math.min(MAX_STAY_NIGHTS, nights)) };
    });
  }

  function chooseDate(date: string) {
    setInput((s) => ({
      ...s,
      endDate: null,
      campDays: 1,
      date: date || null,
      eventTime: date ? s.eventTime : null,
      day: date && s.eventTime ? dayTypeOf(date, s.eventTime) : null,
    }));
  }

  function chooseTime(eventTime: EventTime) {
    setInput((s) => s.date ? { ...s, eventTime, day: dayTypeOf(s.date, eventTime) } : s);
  }

  /** Calendar mark: can the cabins that are free house the whole group for the chosen nights. */
  const stayDetails = stay ? (arrival: Date, nights: number) => stayFitDetails(catalog.stayTypes, stay, arrival, nights, guests) : undefined;

  return { stayDetails, input, set, setCabinUnits, setSauna, catalog, stayTypes: catalog.stayTypes, result, guests, guestLimit, sleepingPlaces, spaces, spaceLabel, extraHour, preset, applyPreset, chooseDate, chooseEnd, chooseTime, today };
}

export type EventCalculatorState = ReturnType<typeof useEventCalculator>;
