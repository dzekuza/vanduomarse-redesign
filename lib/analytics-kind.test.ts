import { describe, expect, it } from "vitest";
import { trackingForPlans, trackingForRequests } from "@/lib/analytics-kind";
import type { PaymentRequestView } from "@/components/reservation/payment-requests";
import type { Plans } from "@/lib/reservation";

const request = (kind: PaymentRequestView["kind"], title: string): PaymentRequestView => ({
  reference: "X", kind, title, date: "2026-12-01", startHour: null, hours: null, nights: null, units: null, guests: null, startTime: null, total: 10,
});

describe("trackingForRequests", () => {
  it("keeps the kind of a single kind of request", () => {
    expect(trackingForRequests([request("pirtis", "Suomiška sauna")])).toEqual({ kind: "sauna", itemName: "Suomiška sauna" });
    expect(trackingForRequests([request("namelis", "A"), request("kemperis", "B")])).toEqual({ kind: "stay" });
    expect(trackingForRequests([request("renginys", "Vakaras")])).toEqual({ kind: "event_registration", itemName: "Vakaras" });
    expect(trackingForRequests([request("keturraciai", "Q")]).kind).toBe("quad_rental");
  });
  it("calls a mix a reservation", () => {
    expect(trackingForRequests([request("pirtis", "A"), request("namelis", "B")])).toEqual({ kind: "reservation" });
  });
});

describe("trackingForPlans", () => {
  it("is a reservation when nothing or several things are planned", () => {
    expect(trackingForPlans({})).toEqual({ kind: "reservation" });
    expect(trackingForPlans({ pirtis: null, nakvyne: null })).toEqual({ kind: "reservation" });
  });
  it("names a single hourly sauna and a single session", () => {
    const sauna = { kind: "pirtis", mode: "hourly", sauna: { name: "Suomiška sauna" } } as unknown as Plans["pirtis"];
    expect(trackingForPlans({ pirtis: sauna })).toEqual({ kind: "sauna", itemName: "Suomiška sauna" });
    const session = { kind: "pirtis", mode: "session", program: { name: "Programa" }, session: { title: "Vakarinė pirtis" } } as unknown as Plans["pirtis"];
    expect(trackingForPlans({ pirtis: session })).toEqual({ kind: "sauna_session", itemName: "Vakarinė pirtis" });
  });
  it("names a single stay and a single quad rental", () => {
    const stay = { kind: "nakvyne", type: { label: "Namelis 2" } } as unknown as Plans["nakvyne"];
    expect(trackingForPlans({ nakvyne: stay })).toEqual({ kind: "stay", itemName: "Namelis 2" });
    expect(trackingForPlans({ keturraciai: { kind: "keturraciai" } as unknown as Plans["keturraciai"] }).kind).toBe("quad_rental");
  });
});
