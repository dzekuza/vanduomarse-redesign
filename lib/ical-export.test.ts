import { describe, expect, it } from "vitest";
import { buildRoomFeed, roomFeedToken } from "./ical-export";
import { parseIcalBlocks } from "./ical";

const event = { bookingId: "11111111-2222-3333-4444-555555555555", unit: 1, reference: "MM-1109", startsOn: "2026-12-30", nights: 3, updatedAt: "2026-11-26T10:15:00.123Z" };

describe("room feed", () => {
  const text = buildRoomFeed("7", [event], new Date("2026-11-26T12:00:00Z"));

  it("writes one all-day event per booking unit, check-out day exclusive", () => {
    expect(text).toContain("DTSTART;VALUE=DATE:20261230\r\n");
    expect(text).toContain("DTEND;VALUE=DATE:20270102\r\n");
    expect(text).toContain("UID:vm-11111111-2222-3333-4444-555555555555-1@vanduomarse.lt\r\n");
    expect(text).toContain("SUMMARY:Vanduo Marse MM-1109\r\n");
    expect(text).toContain("DTSTAMP:20261126T120000Z\r\n");
    expect(text).toContain("LAST-MODIFIED:20261126T101500Z\r\n");
    expect(text.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(text.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("reads back with our own Sirvoy parser as the same nights", () => {
    const blocks = parseIcalBlocks(text, "2026-11-26");
    expect(blocks).toEqual([{ uid: "vm-11111111-2222-3333-4444-555555555555-1@vanduomarse.lt", startsOn: "2026-12-30", nights: 3 }]);
  });

  it("is a valid empty calendar without bookings", () => {
    const empty = buildRoomFeed("1", []);
    expect(empty).toContain("BEGIN:VCALENDAR");
    expect(empty).not.toContain("VEVENT");
  });

  it("folds long lines at 75 octets", () => {
    const long = buildRoomFeed("Labai ilgas kambario pavadinimas su lietuviškomis raidėmis ąčęėįšųūž", []);
    for (const line of long.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });

  it("accepts only 64-hex tokens, with or without .ics", () => {
    const token = "a".repeat(64);
    expect(roomFeedToken(token)).toBe(token);
    expect(roomFeedToken(`${token}.ics`)).toBe(token);
    expect(roomFeedToken("abc")).toBeNull();
    expect(roomFeedToken(`${"g".repeat(64)}`)).toBeNull();
  });
});
