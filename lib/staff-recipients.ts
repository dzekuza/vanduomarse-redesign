import "server-only";
import type { MessageTopic } from "@/lib/notification-topics";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The staff phone numbers and e-mail addresses owners keep in /admin/pranesimai, filtered by topic
 * (`staff_notify_phones_for` / `staff_notify_emails_for`, service role only).
 *
 * Both return `null` when the list cannot be used: nobody with that channel is set up yet, the
 * migration is missing, or the lookup failed. Callers then keep their older routing (the
 * STAFF_NOTIFY_PHONE number, the service inboxes), so a missing migration or a database hiccup never
 * silences staff alerts. An empty array is different: people are set up, none of them wants this.
 */

async function lookup(fn: "staff_notify_phones_for" | "staff_notify_emails_for", topics: MessageTopic[]): Promise<string[] | null> {
  try {
    const { data, error } = await createAdminClient().rpc(fn, { p_topics: topics });
    if (error) {
      console.error(`${fn} failed, using the fallback routing`);
      return null;
    }
    return data;
  } catch {
    console.error(`${fn} failed (no service key?), using the fallback routing`);
    return null;
  }
}

/** Numbers subscribed to any of the topics (or `visi`); null = use STAFF_NOTIFY_PHONE. */
export const staffPhonesFor = (topics: MessageTopic[]) => lookup("staff_notify_phones_for", topics);

/** Addresses subscribed to any of the topics (or `visi`); null = use the service inboxes. */
export const staffEmailsFor = (topics: MessageTopic[]) => lookup("staff_notify_emails_for", topics);
