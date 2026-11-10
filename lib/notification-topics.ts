/**
 * What a staff phone number can be texted about (`notification_recipients.topics`).
 * `visi` means everything, including topics added later, so it is stored on its own
 * rather than expanded into the others.
 */
export const NOTIFICATION_TOPICS = [
  { id: "visi", label: "Visi pranešimai", hint: "Viskas, kas nurodyta žemiau, ir būsimi pranešimų tipai." },
  { id: "rezervacijos", label: "Rezervacijos", hint: "Naujos pirties, nakvynės ir keturračių nuomos rezervacijos bei užklausos." },
  { id: "uzklausos", label: "Užklausos", hint: "Renginių užklausos, bilietai, registracijos į žygius ir skaičiuoklės užklausos." },
  { id: "mokejimai", label: "Mokėjimai", hint: "Gauti mokėjimai, mokėjimai, kuriuos reikia patikrinti, ir dvigubi mokėjimai." },
] as const;

export type NotificationTopic = (typeof NOTIFICATION_TOPICS)[number]["id"];

export const NOTIFICATION_TOPIC_IDS = NOTIFICATION_TOPICS.map((t) => t.id) as [NotificationTopic, ...NotificationTopic[]];

/** The topics a message can be sent under (everything except the `visi` catch-all). */
export type MessageTopic = Exclude<NotificationTopic, "visi">;

export const isNotificationTopic = (value: string): value is NotificationTopic => (NOTIFICATION_TOPIC_IDS as string[]).includes(value);

export const topicLabel = (id: NotificationTopic) => NOTIFICATION_TOPICS.find((t) => t.id === id)!.label;
