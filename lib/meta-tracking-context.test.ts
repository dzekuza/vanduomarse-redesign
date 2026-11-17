import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let cookieJar: Record<string, string> = {};
let requestHeaders: Record<string, string> = {};
let outsideRequest = false;
vi.mock("next/headers", () => ({
  headers: async () => {
    if (outsideRequest) throw new Error("headers() called outside a request");
    return { get: (name: string) => requestHeaders[name] ?? null };
  },
  cookies: async () => ({ get: (name: string) => (name in cookieJar ? { value: cookieJar[name] } : undefined) }),
}));

const { trackingMetadata, trackingFromMetadata } = await import("@/lib/meta-tracking-context");

const FBP = "fb.1.1700000000000.1234567890";
const FBC = "fb.1.1700000000000.AbCdEfGh_ij-kl";

beforeEach(() => {
  cookieJar = {};
  requestHeaders = {};
  outsideRequest = false;
});

describe("trackingMetadata", () => {
  it("records nothing without the marketing consent cookie, whatever else is there", async () => {
    cookieJar = { _fbp: FBP, _fbc: FBC };
    requestHeaders = { "x-forwarded-for": "203.0.113.9", "user-agent": "UA" };
    expect(await trackingMetadata()).toEqual({});
    cookieJar = { vm_mkt: "0", _fbp: FBP };
    expect(await trackingMetadata()).toEqual({});
  });

  it("records consent, the Meta cookies, the first IP hop and the user agent with consent", async () => {
    cookieJar = { vm_mkt: "1", _fbp: FBP, _fbc: FBC };
    requestHeaders = { "x-forwarded-for": "203.0.113.9, 10.0.0.1", "user-agent": "Mozilla/5.0 test" };
    expect(await trackingMetadata()).toEqual({ mk: "1", mk_fbp: FBP, mk_fbc: FBC, mk_ip: "203.0.113.9", mk_ua: "Mozilla/5.0 test" });
  });

  it("drops a malformed Meta cookie and cuts the user agent to Stripe's limit", async () => {
    cookieJar = { vm_mkt: "1", _fbp: "<script>", _fbc: "fb.1.short.x" };
    requestHeaders = { "user-agent": "U".repeat(900) };
    const meta = await trackingMetadata();
    expect(meta.mk).toBe("1");
    expect(meta.mk_fbp).toBeUndefined();
    expect(meta.mk_fbc).toBeUndefined();
    expect(meta.mk_ua).toHaveLength(400);
    expect(Object.values(meta).every((v) => v.length <= 500)).toBe(true);
  });

  it("records nothing when there is no request to read", async () => {
    cookieJar = { vm_mkt: "1" };
    outsideRequest = true;
    expect(await trackingMetadata()).toEqual({});
  });
});

describe("trackingFromMetadata", () => {
  it("reads back what was recorded", () => {
    expect(trackingFromMetadata({ mk: "1", mk_fbp: FBP, mk_fbc: FBC, mk_ip: "203.0.113.9", mk_ua: "UA" })).toEqual({ consent: true, ip: "203.0.113.9", userAgent: "UA", fbp: FBP, fbc: FBC });
  });

  it("treats missing, empty or odd metadata as no consent, and ignores a bad cookie value", () => {
    expect(trackingFromMetadata(null).consent).toBe(false);
    expect(trackingFromMetadata({}).consent).toBe(false);
    expect(trackingFromMetadata({ mk: "yes" }).consent).toBe(false);
    expect(trackingFromMetadata({ mk: "1", mk_fbp: "nonsense" }).fbp).toBeUndefined();
  });
});
