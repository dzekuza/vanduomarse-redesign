"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/** Tables whose changes should refresh the admin (published to Realtime by `20261113220000_realtime_admin_tables.sql`). */
const TABLES = ["bookings", "quad_rentals", "event_tickets", "payments", "coupons", "events", "inquiries", "sauna_blocks", "riders", "purchases", "rider_cards", "rider_sessions", "rider_comments"] as const;

/** A burst of changes (a payment touches several rows) refreshes once, but never later than this after the first change. */
const QUIET_MS = 600;
const MAX_WAIT_MS = 4000;

/**
 * Keeps the admin current without a reload (ADR-0082). Subscribes to Supabase Realtime changes on `TABLES` and, when
 * something changes, re-runs the server data load with `router.refresh()`: the store adopts the fresh data, open
 * dialogs and drafts keep their own state. Changes that arrive while the tab is hidden are applied when it is shown again.
 * Realtime only says that something changed; RLS decides which changes this staff member receives.
 */
export function AdminLiveUpdates() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let quiet: ReturnType<typeof setTimeout> | undefined;
    let maxWait: ReturnType<typeof setTimeout> | undefined;
    let dirty = false;

    const refresh = () => {
      clearTimeout(quiet);
      clearTimeout(maxWait);
      quiet = maxWait = undefined;
      dirty = false;
      router.refresh();
    };

    const onChange = () => {
      if (document.hidden) {
        dirty = true;
        return;
      }
      clearTimeout(quiet);
      quiet = setTimeout(refresh, QUIET_MS);
      maxWait ??= setTimeout(refresh, MAX_WAIT_MS);
    };

    const onVisible = () => {
      if (!document.hidden && dirty) refresh();
    };

    let channel: ReturnType<typeof supabase.channel> | undefined;
    let cancelled = false;
    let subscribedBefore = false;

    void (async () => {
      // Realtime must carry the staff member's JWT, or RLS would hide every row.
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      supabase.realtime.setAuth(data.session?.access_token);
      let next = supabase.channel("admin-live");
      for (const table of TABLES) next = next.on("postgres_changes", { event: "*", schema: "public", table }, onChange);
      channel = next.subscribe((status, error) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") console.error("Admin live updates:", status, error?.message ?? "");
        // After a dropped connection the changes in between were missed: load once to catch up (not on the first connect).
        if (status === "SUBSCRIBED") {
          if (subscribedBefore) onChange();
          subscribedBefore = true;
        }
      });
    })();

    const { data: auth } = supabase.auth.onAuthStateChange((_event, session) => supabase.realtime.setAuth(session?.access_token));
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearTimeout(quiet);
      clearTimeout(maxWait);
      document.removeEventListener("visibilitychange", onVisible);
      auth.subscription.unsubscribe();
      if (channel) void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
