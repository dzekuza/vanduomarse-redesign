import "server-only";
import type { MessageTopic } from "@/lib/notification-topics";
import { staffPhonesFor } from "@/lib/staff-recipients";
import { sendSms } from "./twilio";

/**
 * Staff SMS go to the numbers owners keep in /admin/pranesimai, filtered by topic. Until anyone
 * with a phone is set up there, or if the lookup fails, the old STAFF_NOTIFY_PHONE env var still
 * receives everything (see `lib/staff-recipients.ts`).
 */

async function recipientsFor(topics: MessageTopic[]): Promise<string[]> {
  return (await staffPhonesFor(topics)) ?? (process.env.STAFF_NOTIFY_PHONE ? [process.env.STAFF_NOTIFY_PHONE] : []);
}

/** Texts everyone who wants any of these topics. True when at least one message was accepted. Never throws. */
export async function sendStaffSms(topics: MessageTopic[], body: string): Promise<boolean> {
  const phones = await recipientsFor(topics);
  const results = await Promise.allSettled(phones.map((phone) => sendSms(phone, body)));
  return results.some((r) => r.status === "fulfilled" && r.value);
}
