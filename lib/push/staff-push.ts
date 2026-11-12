import "server-only";
import type { MessageTopic } from "@/lib/notification-topics";
import { createAdminClient } from "@/lib/supabase/admin";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface StaffPushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

async function tokensFor(topic: MessageTopic): Promise<string[]> {
  try {
    const { data, error } = await createAdminClient().rpc("staff_push_tokens_for", { p_topic: topic });
    if (error) {
      // Before migration 20261113180000 is applied, skip silently so SMS/email still succeed.
      return [];
    }
    return data ?? [];
  } catch {
    return [];
  }
}

/**
 * Dispatches an Expo push notification to every active staff device subscribed
 * to `topic`. Never throws; callers run this inside `Promise.allSettled`.
 */
export async function sendStaffPush(topic: MessageTopic, payload: StaffPushPayload): Promise<boolean> {
  const tokens = await tokensFor(topic);
  if (tokens.length === 0) return false;

  const messages = tokens.map((to) => ({
    to,
    sound: "default",
    title: payload.title,
    body: payload.body,
    data: { topic, ...payload.data },
  }));

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });
    return res.ok;
  } catch (err) {
    console.error("Expo push failed", err);
    return false;
  }
}
