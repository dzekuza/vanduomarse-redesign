import { z } from "zod";

/** One-time-code sign-in: a phone or an email, never a password. */
export const loginTargetSchema = z.discriminatedUnion("channel", [
  z.object({ channel: z.literal("phone"), value: z.string().trim().min(6, "Neteisingas telefono numeris.").max(30, "Neteisingas telefono numeris.") }),
  z.object({ channel: z.literal("email"), value: z.email("Neteisingas el. paštas.").max(120, "Neteisingas el. paštas.") }),
]);
export type LoginTarget = z.infer<typeof loginTargetSchema>;

/** Supabase Auth's default code length is 6 and can be raised to 10. */
/**
 * Digits in the sign-in code, by channel: an SMS code has 6, an e-mail code 8 (Supabase Auth sets both). The code field
 * draws that many blocks and confirms when they are filled; the schema below still accepts 4 to 10 on the server.
 */
export const LOGIN_CODE_LENGTH = { phone: 6, email: 8 } as const;

export const loginCodeSchema = z.string().trim().regex(/^\d{4,10}$/, "Įveskite kodą iš žinutės.");

export const customerNameSchema = z.string().trim().min(2, "Įveskite vardą").max(80, "Per ilgas vardas");
