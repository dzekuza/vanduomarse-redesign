import { z } from "zod";
import { NOTIFICATION_TOPIC_IDS } from "@/lib/notification-topics";
import { phoneDigits } from "@/lib/phone-countries";

/** One staff recipient: a phone number (SMS), an e-mail address, or both, and what they are told about. Shared by the form and the server action. */
export const notificationRecipientInput = z
  .object({
    id: z.uuid().nullable(),
    name: z.string().trim().min(2, "Įveskite vardą.").max(80, "Daugiausia 80 simbolių."),
    /** Optional: empty means no SMS. */
    phone: z.string().trim().max(30, "Per ilgas numeris."),
    /** Optional: empty means no e-mail. */
    email: z.string().trim().max(254, "Per ilgas el. paštas."),
    topics: z.array(z.enum(NOTIFICATION_TOPIC_IDS)).min(1, "Pasirinkite bent vieną pranešimų tipą.").transform((t) => [...new Set(t)]),
    active: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const phoneGiven = v.phone !== "";
    if (phoneGiven && phoneDigits(v.phone) < 8) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Įveskite telefono numerį, pvz. +370 612 34567." });
    }
    if (v.email && !z.email().safeParse(v.email).success) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "Įveskite el. pašto adresą, pvz. vardas@vanduomarse.lt." });
    }
    if (!phoneGiven && !v.email) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "Įveskite telefono numerį arba el. paštą." });
    }
  });

export type NotificationRecipientInput = z.input<typeof notificationRecipientInput>;
