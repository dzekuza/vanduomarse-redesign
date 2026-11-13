import type { NotifyService } from "@/lib/contacts";

/**
 * What a staff phone number or e-mail address can be told about (`notification_recipients.topics`).
 * `visi` means everything, including topics added later, so it is stored on its own rather than
 * expanded into the others. The service topics (`pirtis`, `keturraciai`, `nakvyne`) cover the new
 * bookings and the payments of that one service. `group` only orders the admin form.
 */
export const NOTIFICATION_TOPICS = [
  { id: "visi", group: "bendri", label: "Visi pranešimai", hint: "Viskas, kas nurodyta žemiau, ir būsimi pranešimų tipai." },
  { id: "rezervacijos", group: "bendri", label: "Visos rezervacijos", hint: "Naujos pirties, nakvynės ir keturračių nuomos rezervacijos bei užklausos." },
  { id: "uzklausos", group: "bendri", label: "Užklausos", hint: "Renginių užklausos, bilietai, registracijos į žygius ir skaičiuoklės užklausos." },
  { id: "mokejimai", group: "bendri", label: "Visi mokėjimai", hint: "Gauti mokėjimai, mokėjimai, kuriuos reikia patikrinti, ir dvigubi mokėjimai." },
  { id: "pirtis", group: "paslaugos", label: "Pirtis", hint: "Tik pirties rezervacijos ir jų mokėjimai." },
  { id: "keturraciai", group: "paslaugos", label: "Keturračiai", hint: "Tik keturračių nuomos rezervacijos ir jų mokėjimai." },
  { id: "nakvyne", group: "paslaugos", label: "Nakvynė", hint: "Tik nakvynės (nameliai, vietos autodomams) rezervacijos ir jų mokėjimai." },
] as const;

export type NotificationTopic = (typeof NOTIFICATION_TOPICS)[number]["id"];

export const NOTIFICATION_TOPIC_IDS = NOTIFICATION_TOPICS.map((t) => t.id) as [NotificationTopic, ...NotificationTopic[]];

/** The topics a message can be sent under (everything except the `visi` catch-all). */
export type MessageTopic = Exclude<NotificationTopic, "visi">;

/** The topics the mobile app's push registrations know (`staff_push_tokens.topics`); push has no service topics yet. */
export type PushTopic = "rezervacijos" | "uzklausos" | "mokejimai";

export const isNotificationTopic = (value: string): value is NotificationTopic => (NOTIFICATION_TOPIC_IDS as string[]).includes(value);

export const topicLabel = (id: NotificationTopic) => NOTIFICATION_TOPICS.find((t) => t.id === id)!.label;

/** A recipient subscribed to any of these (or to `visi`) is told about a new request of this service. */
export const bookingTopics = (service: NotifyService): MessageTopic[] => (service === "kita" ? ["uzklausos"] : ["rezervacijos", service]);

/** The same for a payment: everyone on `mokejimai`, plus whoever follows each service the paid references belong to. */
export const paymentTopics = (services: NotifyService[]): MessageTopic[] => [
  "mokejimai",
  ...new Set(services.filter((s): s is Exclude<NotifyService, "kita"> => s !== "kita")),
];
