"use client";

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { toast } from "sonner";
import * as actions from "@/app/admin/actions";
import type { ActionResult, NewBookingInput } from "@/app/admin/actions";
import type { AdminData, Booking, BookingStatus, InquiryStatus, ManagedEvent, PriceItem } from "@/lib/admin/types";
import type { SaunaRates } from "@/lib/sauna";
import type { Upsell } from "@/lib/sauna-upsells";

/**
 * Admin data from Supabase (loaded in the admin layout). Every screen talks to
 * these actions only: each applies its change optimistically, runs the server
 * action, and the revalidated layout then resets the store to what the
 * database holds. A failed write shows a toast and is rolled back by that reset.
 */

type Action =
  | { type: "reset"; data: AdminData }
  | { type: "booking/status"; id: string; status: BookingStatus }
  | { type: "booking/add"; booking: Booking }
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

function reducer(state: AdminData, action: Action): AdminData {
  switch (action.type) {
    case "reset":
      return action.data;
    case "booking/status":
      return { ...state, bookings: state.bookings.map((b) => (b.id === action.id ? { ...b, status: action.status } : b)) };
    case "booking/add":
      return { ...state, bookings: [...state.bookings, action.booking] };
    case "block/toggle": {
      const exists = state.blocks.some((b) => b.date === action.date && b.hour === action.hour);
      return {
        ...state,
        blocks: exists
          ? state.blocks.filter((b) => !(b.date === action.date && b.hour === action.hour))
          : [...state.blocks, { id: `pending-${action.date}-${action.hour}`, date: action.date, hour: action.hour, reason: action.reason }],
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

/** Toast on failure; returns whether the write succeeded. */
async function report<T>(pending: Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  const result = await pending;
  if ("error" in result) toast.error(result.error.message);
  return result;
}

function useAdminReducer(initial: AdminData) {
  const [state, dispatch] = useReducer(reducer, initial);

  // The layout re-renders after every server action; adopt the fresh data.
  useEffect(() => dispatch({ type: "reset", data: initial }), [initial]);

  const api = useMemo(
    () => ({
      setBookingStatus: (id: string, status: BookingStatus) => {
        dispatch({ type: "booking/status", id, status });
        return report(actions.setBookingStatus(id, status));
      },
      /** Not optimistic: the reference comes from the database. */
      createBooking: async (input: NewBookingInput) => {
        const result = await actions.createBooking(input);
        if ("data" in result) dispatch({ type: "booking/add", booking: result.data });
        return result;
      },
      toggleBlock: (date: string, hour: number, reason = "Uždaryta") => {
        dispatch({ type: "block/toggle", date, hour, reason });
        return report(actions.toggleBlock(date, hour, reason));
      },
      setInquiryStatus: (id: string, status: InquiryStatus) => {
        dispatch({ type: "inquiry/status", id, status });
        return report(actions.setInquiryStatus(id, status));
      },
      addInquiryNote: (id: string, text: string) => {
        dispatch({ type: "inquiry/note", id, text });
        return report(actions.addInquiryNote(id, text));
      },
      saveEvent: (event: ManagedEvent) => {
        dispatch({ type: "event/upsert", event });
        return report(actions.saveEvent(event));
      },
      deleteEvent: (id: string) => {
        dispatch({ type: "event/delete", id });
        return report(actions.deleteEvent(id));
      },
      setEventPublished: (id: string, published: boolean) => {
        dispatch({ type: "event/publish", id, published });
        return report(actions.setEventPublished(id, published));
      },
      updatePrices: (items: PriceItem[]) => {
        dispatch({ type: "prices/update", items });
        return report(actions.updatePrices(items));
      },
      updateSaunaRates: (rates: SaunaRates) => {
        dispatch({ type: "sauna/rates", rates });
        return report(actions.updateSaunaRates(rates));
      },
      saveUpsell: (upsell: Upsell) => {
        dispatch({ type: "upsell/upsert", upsell });
        return report(actions.saveUpsell(upsell));
      },
      deleteUpsell: (id: string) => {
        dispatch({ type: "upsell/delete", id });
        return report(actions.deleteUpsell(id));
      },
    }),
    [],
  );
  return { ...state, ...api };
}

type AdminStore = ReturnType<typeof useAdminReducer>;

const AdminContext = createContext<AdminStore | null>(null);

export function AdminStoreProvider({ initial, children }: { initial: AdminData; children: React.ReactNode }) {
  const store = useAdminReducer(initial);
  return <AdminContext.Provider value={store}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminStore {
  const store = useContext(AdminContext);
  if (!store) throw new Error("useAdmin must be used inside <AdminStoreProvider>");
  return store;
}
