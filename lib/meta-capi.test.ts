import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const sha = (v: string) => createHash("sha256").update(v).digest("hex");

async function load(pixel = "1234567890", token = "test-token") {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", pixel);
  vi.stubEnv("META_CAPI_ACCESS_TOKEN", token);
  return import("@/lib/meta-capi");
}

describe("Meta Conversions API", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("normalises contacts the way Meta expects before hashing", async () => {
    const { normalizeEmail, normalizePhone, normalizeName } = await load();
    expect(normalizeEmail("  Jonas@Example.LT ")).toBe("jonas@example.lt");
    expect(normalizeEmail("ne-pastas")).toBeNull();
    expect(normalizePhone("+370 612 34567")).toBe("37061234567");
    expect(normalizePhone("8 612 34567")).toBe("37061234567");
    expect(normalizePhone("0037061234567")).toBe("37061234567");
    expect(normalizePhone("61234567")).toBe("37061234567");
    expect(normalizePhone("123")).toBeNull();
    expect(normalizeName(" Žygimantas-Jonas ")).toBe("žygimantasjonas");
  });

  it("hashes personal fields, keeps technical ones plain and always sends Lithuania", async () => {
    const { buildUserData } = await load();
    const data = buildUserData({ email: "Jonas@Example.lt", phone: "+37061234567", firstName: "Jonas", externalId: "r-1", ip: "1.2.3.4", userAgent: "UA", fbp: "fb.1.1.1", fbc: null });
    expect(data).toEqual({
      em: [sha("jonas@example.lt")],
      ph: [sha("37061234567")],
      fn: [sha("jonas")],
      external_id: [sha("r-1")],
      country: [sha("lt")],
      client_ip_address: "1.2.3.4",
      client_user_agent: "UA",
      fbp: "fb.1.1.1",
    });
  });

  it("builds one website event with the shared event id and the custom data", async () => {
    const { buildCapiPayload } = await load();
    const payload = buildCapiPayload({
      name: "Purchase", eventId: "purchase-AB-7", sourceUrl: "https://www.vanduomarse.lt/registracija/apmoketa", time: 1_800_000_000,
      user: { ip: "1.2.3.4" }, custom: { value: 675, currency: "EUR", coupon: "WAKEBLACKFRIDAY2026" },
    });
    expect(payload).toMatchObject({
      event_name: "Purchase", event_id: "purchase-AB-7", event_time: 1_800_000_000, action_source: "website",
      event_source_url: "https://www.vanduomarse.lt/registracija/apmoketa", custom_data: { value: 675, currency: "EUR", coupon: "WAKEBLACKFRIDAY2026" },
    });
  });

  it("posts to the Pixel's events endpoint with the token, and stays silent without one", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response("{}", { status: 200 })));
    vi.stubGlobal("fetch", fetchMock);
    const { sendCapiEvent, META_GRAPH_VERSION } = await load();
    await sendCapiEvent({ name: "Lead", eventId: "abc12345", sourceUrl: "https://www.vanduomarse.lt/", time: 1, user: {} });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`https://graph.facebook.com/${META_GRAPH_VERSION}/1234567890/events?access_token=test-token`);
    expect(JSON.parse(String(init.body)).data[0]).toMatchObject({ event_name: "Lead", event_id: "abc12345" });

    fetchMock.mockClear();
    const unconfigured = await load("1234567890", "");
    await unconfigured.sendCapiEvent({ name: "Lead", eventId: "abc12345", sourceUrl: "https://www.vanduomarse.lt/", time: 1, user: {} });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never throws when Meta refuses or the network fails", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const event = { name: "ViewContent" as const, eventId: "abc12345", sourceUrl: "https://www.vanduomarse.lt/", time: 1, user: {} };
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response('{"error":{"message":"Invalid OAuth access token"}}', { status: 400 }))));
    const refused = await load();
    await expect(refused.sendCapiEvent(event)).resolves.toBeUndefined();
    expect(logged).toHaveBeenCalledWith(expect.stringContaining("rejected (400)"));

    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
    const offline = await load();
    await expect(offline.sendCapiEvent(event)).resolves.toBeUndefined();
  });

  it("adds the test code only to events from localhost, never to the live site", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response("{}", { status: 200 })));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("META_CAPI_TEST_EVENT_CODE", "TEST123");
    const { sendCapiEvent } = await load();
    vi.stubEnv("META_CAPI_TEST_EVENT_CODE", "TEST123");
    await sendCapiEvent({ name: "Lead", eventId: "abc12345", sourceUrl: "https://www.vanduomarse.lt/", time: 1, user: {} });
    await sendCapiEvent({ name: "Lead", eventId: "abc12346", sourceUrl: "http://localhost:3000/", time: 1, user: {} });
    const bodies = fetchMock.mock.calls.map((c) => JSON.parse(String((c as unknown as [string, RequestInit])[1].body)));
    expect(bodies[0].test_event_code).toBeUndefined();
    expect(bodies[1].test_event_code).toBe("TEST123");
  });
});
