import { z } from "zod";

/** What a visitor types in step 1 of /registracija. */
export const registrationSchema = z.object({
  name: z.string().trim().min(1, "Įveskite vardą").max(60),
  surname: z.string().trim().min(1, "Įveskite pavardę").max(60),
  email: z.email("Neteisingas el. paštas").max(120),
  phone: z.string().trim().min(6, "Įveskite telefono numerį").max(30),
  phone2: z.string().trim().max(30).optional(),
  birthdate: z.iso.date("Neteisinga data"),
  /** Honeypot: left empty by a person, filled by a bot. Same shape as `contactFields` in `lib/quad-schema.ts`. */
  website: z.string().max(0).optional(),
});
export type RegistrationInput = z.infer<typeof registrationSchema>;
