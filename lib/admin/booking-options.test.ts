import { describe, expect, it } from "vitest";
import { bookingOptionsOn, type BookingOptionsSource } from "@/lib/admin/booking-options";
import type { Booking, ManagedEvent } from "@/lib/admin/types";
import type { StayType } from "@/lib/cabin";

const event = (over: Partial<ManagedEvent>) =>
  ({ id: "e", title: "Seansas", category: "pirtis", date: "2026-11-20", time: "18:00", place: "Pirtis", blurb: "", price: 10, capacity: 10, sold: 3, held: 2, published: true, ...over }) as ManagedEvent;
const stay = (over: Partial<StayType>): StayType => ({ id: "namelis-2", kind: "namelis", label: "Namelis 2", note: "", maxGuests: 2, pricePerNight: 80, units: 3, active: true, sortOrder: 1, ...over });
const stayBooking = { id: "b", reference: "R", kind: "namelis", stayTypeId: "namelis-2", stayUnits: 2, nights: 2, date: "2026-11-19", status: "patvirtinta", customer: { name: "A", phone: "", email: "" }, guests: 2, extras: [], total: 0, createdAt: "" } as Booking;

const base: BookingOptionsSource = { events: [], bookings: [], blocks: [], saunas: [], stayTypes: [] };

describe("bookingOptionsOn", () => {
  it("lists the day's bookable events by time with places left (sold and held count as taken)", () => {
    const events = [event({ id: "late", time: "20:00" }), event({ id: "early", time: "09:00", capacity: null }), event({ id: "other-day", date: "2026-11-21" })];
    const { events: out } = bookingOptionsOn("2026-11-20", { ...base, events });
    expect(out.map((o) => [o.event.id, o.left])).toEqual([["early", null], ["late", 5]]);
  });

  it("leaves out private calendar entries and quad tour departures, and reports a full event as 0 left", () => {
    const events = [event({ id: "private", calendarPrivate: true }), event({ id: "tour", tourRouteId: "t1" }), event({ id: "full", sold: 10, held: 1 })];
    const { events: out } = bookingOptionsOn("2026-11-20", { ...base, events });
    expect(out.map((o) => [o.event.id, o.left])).toEqual([["full", 0]]);
  });

  it("counts free cabin units for the night and treats a null stock as unlimited", () => {
    const { stays } = bookingOptionsOn("2026-11-20", { ...base, bookings: [stayBooking], stayTypes: [stay({}), stay({ id: "kemperis", kind: "kemperis", label: "Kemperis", units: null, sortOrder: 2 }), stay({ id: "off", active: false })] });
    expect(stays.map((s) => [s.type.id, s.free])).toEqual([["namelis-2", 1], ["kemperis", null]]);
  });

  it("does not count a stay that has already ended", () => {
    const { stays } = bookingOptionsOn("2026-11-22", { ...base, bookings: [stayBooking], stayTypes: [stay({})] });
    expect(stays[0].free).toBe(3);
  });
});
