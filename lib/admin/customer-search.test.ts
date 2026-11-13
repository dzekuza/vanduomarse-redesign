import { describe, expect, it } from "vitest";
import { phoneForForm, searchCustomers } from "@/lib/admin/customer-search";
import type { Rider } from "@/lib/admin/types";

const rider = (over: Partial<Rider>): Rider => ({
  id: "r",
  name: "Test",
  surname: "Testas",
  phone: null,
  phone2: null,
  email: null,
  birthdate: null,
  avatarPath: null,
  planId: null,
  createdAt: "2026-01-01T00:00:00Z",
  selfRegistered: false,
  ...over,
});

const riders = [
  rider({ id: "1", name: "Žilvinas", surname: "Kazlauskas", phone: "+370 61234567", email: "z@x.lt" }),
  rider({ id: "2", name: "Jolanta", surname: "Vanduo", phone: "867312315" }),
  rider({ id: "3", name: "Rysard", surname: "Testas", phone: "+37060011122", phone2: "+370 65555555" }),
];

const none = { name: "", phone: "" };

describe("searchCustomers by name", () => {
  it("needs two letters", () => {
    expect(searchCustomers(riders, "name", { ...none, name: "j" })).toEqual([]);
  });
  it("ignores diacritics and matches any word order", () => {
    expect(searchCustomers(riders, "name", { ...none, name: "zilv" }).map((r) => r.id)).toEqual(["1"]);
    expect(searchCustomers(riders, "name", { ...none, name: "kazlauskas ž" }).map((r) => r.id)).toEqual(["1"]);
  });
  it("leaves out the customer already chosen", () => {
    const typed = { name: "Jolanta Vanduo", phone: "+370 67312315" };
    expect(searchCustomers(riders, "name", typed)).toEqual([]);
  });
});

describe("searchCustomers by phone", () => {
  it("needs three digits", () => {
    expect(searchCustomers(riders, "phone", { ...none, phone: "+370 61" })).toEqual([]);
  });
  it("matches the national digits whichever way the stored number is written", () => {
    expect(searchCustomers(riders, "phone", { ...none, phone: "+370 6731" }).map((r) => r.id)).toEqual(["2"]);
    expect(searchCustomers(riders, "phone", { ...none, phone: "+370 6123" }).map((r) => r.id)).toEqual(["1"]);
  });
  it("also searches the second phone", () => {
    expect(searchCustomers(riders, "phone", { ...none, phone: "+370 65555" }).map((r) => r.id)).toEqual(["3"]);
  });
  it("treats a typed leading 8 as the trunk prefix", () => {
    expect(searchCustomers(riders, "phone", { ...none, phone: "86731" }).map((r) => r.id)).toEqual(["2"]);
  });
});

describe("phoneForForm", () => {
  it("writes Lithuanian numbers as +370 …", () => {
    expect(phoneForForm("867312315")).toBe("+370 67312315");
    expect(phoneForForm("+370 61234567")).toBe("+370 61234567");
  });
  it("keeps foreign numbers and empty values", () => {
    expect(phoneForForm("+44 7700 900123")).toBe("+44 7700 900123");
    expect(phoneForForm(null)).toBe("");
  });
});
