import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// notify.ts pulls in every channel; only settle() is under test here.
vi.mock("@/lib/email/notify", () => ({}));
vi.mock("@/lib/sms/notify", () => ({}));
vi.mock("@/lib/push/staff-push", () => ({}));
vi.mock("@/lib/staff-notifications", () => ({}));
vi.mock("@/lib/contacts", () => ({}));
vi.mock("@/lib/paid-request", () => ({}));
vi.mock("@/lib/notification-topics", () => ({}));

const { settle } = await import("@/lib/notify");

let error: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  error = vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubEnv("NODE_ENV", "production");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("settle", () => {
  it("stays quiet when at least one channel delivered", async () => {
    await settle("payment-received", Promise.resolve(false), Promise.resolve(true));
    expect(error).not.toHaveBeenCalled();
  });

  it("logs a channel that threw, without failing the caller", async () => {
    await expect(settle("request-filed", Promise.reject(new Error("boom")), Promise.resolve(true))).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledWith("Notify request-filed: channel 0 threw", expect.any(Error));
  });

  it("logs when no channel reached anyone", async () => {
    await settle("duplicate-payment", Promise.resolve(false), Promise.resolve(false));
    expect(error).toHaveBeenCalledWith("Notify duplicate-payment: no channel delivered");
  });

  it("does not treat skipped channels as a failure in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    await settle("request-filed", Promise.resolve(false));
    expect(error).not.toHaveBeenCalled();
  });
});
