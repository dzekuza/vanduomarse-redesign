import { z } from "zod";
import { NOTIFICATION_TOPIC_IDS } from "@/lib/notification-topics";

/** One staff phone number and what it is texted about. Shared by the form and the server action. */
export const notificationRecipientInput = z.object({
  id: z.uuid().nullable(),
  name: z.string().trim().min(2, "Įveskite vardą.").max(80, "Daugiausia 80 simbolių."),
  phone: z
    .string()
    .trim()
    .max(30, "Per ilgas numeris.")
    .refine((v) => v.replace(/\D/g, "").length >= 8, "Įveskite telefono numerį, pvz. +370 612 34567."),
  topics: z.array(z.enum(NOTIFICATION_TOPIC_IDS)).min(1, "Pasirinkite bent vieną pranešimų tipą.").transform((t) => [...new Set(t)]),
  active: z.boolean(),
});

export type NotificationRecipientInput = z.input<typeof notificationRecipientInput>;
