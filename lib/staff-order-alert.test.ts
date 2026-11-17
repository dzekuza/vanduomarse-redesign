import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const sendStaffSms = vi.fn<(topics: string[], body: string) => Promise<boolean>>(async () => true);
const sendStaffPush = vi.fn<(topic: string, payload: { title: string; body: string; data?: Record<string, string> }) => Promise<boolean>>(async () => true);
vi.mock("@/lib/sms/staff-recipients", () => ({ sendStaffSms: (t: string[], b: string) => sendStaffSms(t, b) }));
vi.mock("@/lib/push/staff-push", () => ({ sendStaffPush: (t: string, p: { title: string; body: string; data?: Record<string, string> }) => sendStaffPush(t, p) }));

const { alertStaffPaidOrder, paidOrderSmsText } = await import("@/lib/staff-order-alert");

beforeEach(() => {
  sendStaffSms.mockClear();
  sendStaffPush.mockClear();
  sendStaffSms.mockResolvedValue(true);
  sendStaffPush.mockResolvedValue(true);
});

describe("paidOrderSmsText", () => {
  it("names what was paid, the reference and the amount, and where to look", () => {
    expect(paidOrderSmsText({ kind: "abonementas", reference: "PS-F1220CDB", amount: 3.75, review: false, gift: true })).toBe("Apmoketas abonementas PS-F1220CDB: 3.75 EUR (dovana). Zr. /admin/apyrankes");
    expect(paidOrderSmsText({ kind: "planas", reference: "AB-7", amount: 675, review: false })).toBe("Apmoketas planas AB-7: 675 EUR. Zr. /admin/apyrankes");
    expect(paidOrderSmsText({ kind: "kuponas", reference: "KP-1016", amount: 25, review: false })).toBe("Apmoketas kuponas KP-1016: 25 EUR. Zr. /admin/kuponai");
  });

  it("shouts when the paid amount did not match", () => {
    expect(paidOrderSmsText({ kind: "abonementas", reference: "PS-1", amount: 100, review: true })).toBe("PATIKRINTI ABONEMENTAS MOKEJIMA PS-1: 100 EUR. Zr. /admin/apyrankes");
  });

  it("is plain ASCII and fits one 160-character message", () => {
    for (const kind of ["abonementas", "planas", "kuponas"] as const) {
      for (const review of [false, true]) {
        const text = paidOrderSmsText({ kind, reference: "PS-F1220CDB", amount: 1234.5, review, gift: true });
        expect(text).toMatch(/^[\x20-\x7e]+$/);
        expect(text.length).toBeLessThanOrEqual(160);
      }
    }
  });
});

describe("alertStaffPaidOrder", () => {
  it("texts everyone who follows payments and pushes the app, with a reference and amount only", async () => {
    await alertStaffPaidOrder({ kind: "abonementas", reference: "PS-F1220CDB", amount: 3.75, review: false, gift: true });
    expect(sendStaffSms).toHaveBeenCalledWith(["mokejimai"], "Apmoketas abonementas PS-F1220CDB: 3.75 EUR (dovana). Zr. /admin/apyrankes");
    expect(sendStaffPush).toHaveBeenCalledWith("mokejimai", { title: "Apmokėtas abonementas", body: "PS-F1220CDB · 3.75 € · dovana", data: { references: "PS-F1220CDB" } });
  });

  it("titles a payment that needs a look as such", async () => {
    await alertStaffPaidOrder({ kind: "kuponas", reference: "KP-9", amount: 40, review: true });
    expect(sendStaffPush.mock.calls[0][1].title).toBe("Patikrinti mokėjimą");
  });

  it("never throws, and one failing channel does not stop the other", async () => {
    sendStaffSms.mockRejectedValue(new Error("twilio down"));
    await expect(alertStaffPaidOrder({ kind: "planas", reference: "AB-7", amount: 675, review: false })).resolves.toBeUndefined();
    expect(sendStaffPush).toHaveBeenCalledTimes(1);
    sendStaffSms.mockResolvedValue(true);
    sendStaffPush.mockRejectedValue(new Error("expo down"));
    await expect(alertStaffPaidOrder({ kind: "planas", reference: "AB-7", amount: 675, review: false })).resolves.toBeUndefined();
    expect(sendStaffSms).toHaveBeenCalledTimes(2);
  });
});
