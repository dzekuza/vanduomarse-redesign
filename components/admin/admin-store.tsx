"use client";

import { createContext, useContext, useMemo, useReducer } from "react";
import { seedBlocks, seedBookings, seedEvents, seedInquiries, seedPrices } from "@/lib/admin/mock-data";
import type { Block, Booking, BookingStatus, Inquiry, InquiryStatus, ManagedEvent, PriceItem } from "@/lib/admin/types";
import { DEFAULT_SAUNA_RATES, type SaunaRates } from "@/lib/sauna";
import { DEFAULT_UPSELLS, type Upsell } from "@/lib/sauna-upsells";

/**
 * In-memory admin data for the UI-first phase (ADR-0005). Every screen talks to
 * these actions only, so swapping the reducer for Supabase calls later does not
 * touch the pages. Changes reset on reload.
 */

interface AdminState {
  bookings: Booking[];
  blocks: Block[];
  inquiries: Inquiry[];
  events: ManagedEvent[];
  prices: PriceItem[];
  saunaRates: SaunaRates;
  upsells: Upsell[];
}

type Action =
  | { type: "booking/status"; id: string; status: BookingStatus }
  | { type: "block/toggle"; date: string; hour: number; reason: string }
  | { type: "inquiry/status"; id: string; status: InquiryStatus }
  | { type: "inquiry/note"; id: string; text: string }
  | { type: "event/upsert"; event: ManagedEvent }
  | { type: "event/delete"; id: string }
  | { type: "event/publish"; id: string; published: boolean }
  | { type: "prices/update"; items: PriceItem[] }
  | { type: "sauna/rates"; rates: SaunaRates }
  | { type: "upsell/upsert"; upsell: Upsell }
  | { type: "upsell/delete"; id: string };

function reducer(state: AdminState, action: Action): AdminState {
  switch (action.type) {
    case "booking/status":
      return { ...state, bookings: state.bookings.map((b) => (b.id === action.id ? { ...b, status: action.status } : b)) };
    case "block/toggle": {
      const exists = state.blocks.some((b) => b.date === action.date && b.hour === action.hour);
      return {
        ...state,
        blocks: exists
          ? state.blocks.filter((b) => !(b.date === action.date && b.hour === action.hour))
          : [...state.blocks, { id: `blk-${action.date}-${action.hour}`, date: action.date, hour: action.hour, reason: action.reason }],
      };
    }
    case "inquiry/status":
      return { ...state, inquiries: state.inquiries.map((q) => (q.id === action.id ? { ...q, status: action.status } : q)) };
    case "inquiry/note":
      return {
        ...state,
        inquiries: state.inquiries.map((q) =>
          q.id === action.id ? { ...q, notes: [...q.notes, { at: new Date().toISOString(), text: action.text }] } : q,
        ),
      };
    case "event/upsert": {
      const exists = state.events.some((e) => e.id === action.event.id);
      const events = exists ? state.events.map((e) => (e.id === action.event.id ? action.event : e)) : [...state.events, action.event];
      return { ...state, events: events.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)) };
    }
    case "event/delete":
      return { ...state, events: state.events.filter((e) => e.id !== action.id) };
    case "event/publish":
      return { ...state, events: state.events.map((e) => (e.id === action.id ? { ...e, published: action.published } : e)) };
    case "prices/update": {
      const next = new Map(action.items.map((i) => [i.id, i]));
      return { ...state, prices: state.prices.map((p) => next.get(p.id) ?? p) };
    }
    case "sauna/rates":
      return { ...state, saunaRates: action.rates };
    case "upsell/upsert": {
      const exists = state.upsells.some((u) => u.id === action.upsell.id);
      return {
        ...state,
        upsells: exists ? state.upsells.map((u) => (u.id === action.upsell.id ? action.upsell : u)) : [...state.upsells, action.upsell],
      };
    }
    case "upsell/delete":
      return { ...state, upsells: state.upsells.filter((u) => u.id !== action.id) };
  }
}

function initialState(): AdminState {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return {
    bookings: seedBookings(today),
    blocks: seedBlocks(today),
    inquiries: seedInquiries(today),
    events: seedEvents(today),
    prices: seedPrices(),
    saunaRates: DEFAULT_SAUNA_RATES,
    upsells: DEFAULT_UPSELLS,
  };
}

function useAdminReducer() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const actions = useMemo(
    () => ({
      setBookingStatus: (id: string, status: BookingStatus) => dispatch({ type: "booking/status", id, status }),
      toggleBlock: (date: string, hour: number, reason = "Uždaryta") => dispatch({ type: "block/toggle", date, hour, reason }),
      setInquiryStatus: (id: string, status: InquiryStatus) => dispatch({ type: "inquiry/status", id, status }),
      addInquiryNote: (id: string, text: string) => dispatch({ type: "inquiry/note", id, text }),
      saveEvent: (event: ManagedEvent) => dispatch({ type: "event/upsert", event }),
      deleteEvent: (id: string) => dispatch({ type: "event/delete", id }),
      setEventPublished: (id: string, published: boolean) => dispatch({ type: "event/publish", id, published }),
      updatePrices: (items: PriceItem[]) => dispatch({ type: "prices/update", items }),
      updateSaunaRates: (rates: SaunaRates) => dispatch({ type: "sauna/rates", rates }),
      saveUpsell: (upsell: Upsell) => dispatch({ type: "upsell/upsert", upsell }),
      deleteUpsell: (id: string) => dispatch({ type: "upsell/delete", id }),
    }),
    [],
  );
  return { ...state, ...actions };
}

type AdminStore = ReturnType<typeof useAdminReducer>;

const AdminContext = createContext<AdminStore | null>(null);

export function AdminStoreProvider({ children }: { children: React.ReactNode }) {
  const store = useAdminReducer();
  return <AdminContext.Provider value={store}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminStore {
  const store = useContext(AdminContext);
  if (!store) throw new Error("useAdmin must be used inside <AdminStoreProvider>");
  return store;
}
