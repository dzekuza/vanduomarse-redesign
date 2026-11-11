"use server";

import { cookies } from "next/headers";
import { GATE_COOKIE, GATE_COOKIE_MAX_AGE, gateCode, gatePassToken, sameToken } from "@/lib/site-gate";
import { siteGateOn } from "@/lib/site-gate-flag";
import { gateCodeSchema } from "@/lib/site-gate-schema";

export type GateResult = { ok: true } | { error: string };

/** Checks the preview code typed on the gate page and, when right, sets the pass cookie. */
export async function enterSiteGate(input: unknown): Promise<GateResult> {
  const parsed = gateCodeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Neteisingas kodas." };
  const code = gateCode();
  if (!(await siteGateOn()) || !code) return { error: "Peržiūra šiuo metu išjungta." };

  const [typed, expected] = await Promise.all([gatePassToken(parsed.data.code), gatePassToken(code)]);
  if (!sameToken(typed, expected)) {
    // Slow down guessing a little; long codes are the real protection.
    await new Promise((r) => setTimeout(r, 800));
    return { error: "Neteisingas kodas." };
  }

  (await cookies()).set(GATE_COOKIE, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GATE_COOKIE_MAX_AGE,
  });
  return { ok: true };
}
