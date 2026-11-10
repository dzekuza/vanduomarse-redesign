import "server-only";
import type { MessageTopic } from "@/lib/notification-topics";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSms } from "./twilio";

/**
 * Staff SMS go to the numbers owners keep in /admin/pranesimai, filtered by topic
 * (`staff_notify_phones`, service role only). Until anyone is set up there, or if the
 * lookup fails, the old STAFF_NOTIFY_PHONE env var still receives everything, so a
 * missing migration or a database hiccup never silences staff alerts.
 */

async function recipientsFor(topic: MessageTopic): Promise<string[]> {
  const fallback = process.env.STAFF_NOTIFY_PHONE ? [process.env.STAFF_NOTIFY_PHONE] : [];
  try {
    const { data, error } = await createAdminClient().rpc("staff_notify_phones", { p_topic: topic });
    if (error) {
      console.error("staff_notify_phones failed, using STAFF_NOTIFY_PHONE");
      return fallback;
    }
    return data ?? fallback;
  } catch {
    console.error("staff_notify_phones failed (no service key?), using STAFF_NOTIFY_PHONE");
    return fallback;
  }
}

/** Texts everyone who wants this topic. True when at least one message was accepted. Never throws. */
export async function sendStaffSms(topic: MessageTopic, body: string): Promise<boolean> {
  const phones = await recipientsFor(topic);
  const results = await Promise.allSettled(phones.map((phone) => sendSms(phone, body)));
  return results.some((r) => r.status === "fulfilled" && r.value);
}
