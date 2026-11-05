import { z } from "zod";

/** The preview code typed on the gate page (`GateCodeForm`, `enterSiteGate`). */
export const gateCodeSchema = z.object({
  code: z.string().trim().min(1, "Įvesk kodą.").max(128, "Per ilgas kodas."),
});
export type GateCodeValues = z.infer<typeof gateCodeSchema>;
