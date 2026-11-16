import { describe, expect, it } from "vitest";
import { IcalError, MAX_BLOCK_NIGHTS, parseIcalBlocks } from "@/lib/ical";

const calendar = (...events: string[]) => ["BEGIN:VCALENDAR", "VERSION:2.0", ...events, "END:VCALENDAR"].join("\r\n");
const event = (...props: string[]) => ["BEGIN:VEVENT", ...props, "END:VEVENT"].join("\r\n");

const TODAY = "2026-11-16";

describe("parseIcalBlocks", () => {
  it("reads all-day events with an exclusive end", () => {
    const text = calendar(event("UID:a1", "DTSTART;VALUE=DATE:20261120", "DTEND;VALUE=DATE:20261123"));
    expect(parseIcalBlocks(text, TODAY)).toEqual([{ uid: "a1", startsOn: "2026-11-20", nights: 3 }]);
  });

  it("takes at least one night when the end is the start or missing", () => {
    const text = calendar(event("UID:a", "DTSTART:20261120", "DTEND:20261120"), event("UID:b", "DTSTART:20261125"));
    expect(parseIcalBlocks(text, TODAY).map((b) => b.nights)).toEqual([1, 1]);
  });

  it("uses DURATION when there is no end", () => {
    const text = calendar(event("UID:a", "DTSTART:20261120", "DURATION:P2D"));
    expect(parseIcalBlocks(text, TODAY)[0]?.nights).toBe(2);
  });

  it("converts UTC date-times to the Vilnius day", () => {
    // 22:30 UTC on 20 Nov is already 21 Nov in Vilnius (UTC+2).
    const text = calendar(event("UID:a", "DTSTART:20261120T223000Z", "DTEND:20261122T100000Z"));
    expect(parseIcalBlocks(text, TODAY)).toEqual([{ uid: "a", startsOn: "2026-11-21", nights: 1 }]);
  });

  it("takes the date of a local date-time as written", () => {
    const text = calendar(event("UID:a", "DTSTART:20261120T150000", "DTEND:20261122T110000"));
    expect(parseIcalBlocks(text, TODAY)).toEqual([{ uid: "a", startsOn: "2026-11-20", nights: 2 }]);
  });

  it("drops cancelled events and stretches that ended on or before today", () => {
    const text = calendar(
      event("UID:old", "DTSTART:20261110", "DTEND:20261116"),
      event("UID:gone", "DTSTART:20261120", "DTEND:20261122", "STATUS:CANCELLED"),
      event("UID:now", "DTSTART:20261115", "DTEND:20261117"),
    );
    expect(parseIcalBlocks(text, TODAY).map((b) => b.uid)).toEqual(["now"]);
  });

  it("undoes line folding", () => {
    const text = ["BEGIN:VCALENDAR", "BEGIN:VEVENT", "UID:long-", " id-123", "DTSTART:20261120", "DTEND:20261121", "END:VEVENT", "END:VCALENDAR"].join("\n");
    expect(parseIcalBlocks(text, TODAY)[0]?.uid).toBe("long-id-123");
  });

  it("keeps duplicate ids apart and invents one when missing", () => {
    const text = calendar(event("UID:x", "DTSTART:20261120", "DTEND:20261121"), event("UID:x", "DTSTART:20261122", "DTEND:20261123"), event("DTSTART:20261124", "DTEND:20261125"));
    const uids = parseIcalBlocks(text, TODAY).map((b) => b.uid);
    expect(new Set(uids).size).toBe(3);
  });

  it("caps very long stretches", () => {
    const text = calendar(event("UID:a", "DTSTART:20261120", "DTEND:20300101"));
    expect(parseIcalBlocks(text, TODAY)[0]?.nights).toBe(MAX_BLOCK_NIGHTS);
  });

  it("ignores events without a usable start and invalid dates", () => {
    const text = calendar(event("UID:a", "DTEND:20261121"), event("UID:b", "DTSTART:20261340", "DTEND:20261341"));
    expect(parseIcalBlocks(text, TODAY)).toEqual([]);
  });

  it("returns an empty list for a calendar with no events", () => {
    expect(parseIcalBlocks(calendar(), TODAY)).toEqual([]);
  });

  it("rejects text that is not a calendar", () => {
    expect(() => parseIcalBlocks("<html>Sign in</html>", TODAY)).toThrow(IcalError);
    expect(() => parseIcalBlocks("", TODAY)).toThrow(IcalError);
  });

  it("sorts by first night", () => {
    const text = calendar(event("UID:b", "DTSTART:20261201", "DTEND:20261202"), event("UID:a", "DTSTART:20261120", "DTEND:20261121"));
    expect(parseIcalBlocks(text, TODAY).map((b) => b.uid)).toEqual(["a", "b"]);
  });
});
