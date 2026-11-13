import { describe, expect, it } from "vitest";
import { searchAdmin, type SearchSource } from "@/lib/admin/global-search";
import type { Booking, Coupon, Inquiry, QuadRental, Rider, TourTicket } from "@/lib/admin/types";

const empty: SearchSource = { riders: [], bookings: [], stayTypes: [], quadRentals: [], quadTypes: [], tourTickets: [], eventTickets: [], events: [], coupons: [], inquiries: [] };

const rider = { id: "r1", name: "Žilvinas", surname: "Kazlauskas", phone: "+370 61234567", phone2: null, email: "z@x.lt" } as Rider;
const booking = (over: Partial<Booking>) =>
  ({ id: "b1", reference: "PM-1001", kind: "pirtis", customer: { name: "Jolanta Vanduo", email: "j@x.lt", phone: "867312315" }, date: "2026-11-20", guests: 2, extras: [], total: 50, status: "patvirtinta", createdAt: "2026-11-01T00:00:00Z", ...over }) as Booking;

describe("searchAdmin", () => {
  it("returns nothing for a query under two characters", () => {
    expect(searchAdmin({ ...empty, riders: [rider] }, "z")).toEqual([]);
  });

  it("finds a customer by name without diacritics and links to their page", () => {
    const [hit] = searchAdmin({ ...empty, riders: [rider] }, "zilvinas kaz");
    expect(hit).toMatchObject({ group: "klientai", title: "Žilvinas Kazlauskas", target: { kind: "link", href: "/admin/klientai/r1" } });
  });

  it("finds a customer or booking by phone digits, however the number is written", () => {
    expect(searchAdmin({ ...empty, riders: [rider] }, "61234").map((h) => h.key)).toEqual(["rider-r1"]);
    expect(searchAdmin({ ...empty, bookings: [booking({})] }, "867312315").map((h) => h.key)).toEqual(["booking-b1"]);
    expect(searchAdmin({ ...empty, bookings: [booking({})] }, "+370 67312").map((h) => h.key)).toEqual(["booking-b1"]);
  });

  it("finds a booking by reference and opens its panel", () => {
    const [hit] = searchAdmin({ ...empty, bookings: [booking({})] }, "pm-1001");
    expect(hit).toMatchObject({ group: "rezervacijos", target: { kind: "booking", id: "b1" } });
  });

  it("opens a ticket's event, a rental's panel, a coupon and links an inquiry", () => {
    const data: SearchSource = {
      ...empty,
      quadRentals: [{ id: "q1", reference: "KT-7", items: [], units: 2, date: "2026-11-20", customer: { name: "Rimas", email: "", phone: "" }, createdAt: "2026-11-02T00:00:00Z" } as unknown as QuadRental],
      eventTickets: [{ id: "t1", reference: "BL-3", eventId: "e9", eventTitle: "Koncertas", eventDate: "2026-12-01", customer: { name: "Rimas", email: "", phone: "" }, createdAt: "2026-11-02T00:00:00Z" } as unknown as TourTicket],
      coupons: [{ id: "c1", reference: "KP-5", code: "ABC", productName: "Dovanų kuponas", buyer: { name: "Rimas", email: "" }, recipientName: "", recipientEmail: "" } as unknown as Coupon],
      inquiries: [{ id: "i1", customer: { name: "Rimas", email: "", phone: "" }, eventType: "Gimtadienis", date: "2026-12-05" } as unknown as Inquiry],
    };
    const targets = Object.fromEntries(searchAdmin(data, "rimas").map((h) => [h.group, h.target]));
    expect(targets).toEqual({
      keturraciai: { kind: "rental", id: "q1" },
      bilietai: { kind: "event", id: "e9" },
      kuponai: { kind: "coupon", id: "c1" },
      uzklausos: { kind: "link", href: "/admin/uzklausos" },
    });
  });

  it("caps each group, newest first, and keeps the group order", () => {
    const many = Array.from({ length: 8 }, (_, i) => booking({ id: `b${i}`, reference: `PM-${i}`, createdAt: `2026-11-0${i + 1}T00:00:00Z` }));
    const hits = searchAdmin({ ...empty, riders: [{ ...rider, name: "Jolanta" }], bookings: many }, "jolanta");
    expect(hits.map((h) => h.group)).toEqual(["klientai", ...Array(5).fill("rezervacijos")]);
    expect(hits[1].key).toBe("booking-b7");
  });
});
