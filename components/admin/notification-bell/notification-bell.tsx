"use client";

import { BellIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { NotificationItem } from "./notification-item";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NOTIFICATIONS_HREF } from "@/lib/admin/permissions";

/** A staff member who never opened the bell sees the last day as new, not the whole history. */
const FIRST_VISIT_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * The bell in the admin header (ADR-0088): the latest notifications this role may see, live. New rows arrive through
 * Supabase Realtime (`AdminLiveUpdates` refreshes the store when `staff_notifications` changes) and also pop up as a toast.
 * Opening the bell marks everything as seen for this staff member; the rows that were new stay highlighted until it closes.
 */
export function NotificationBell() {
  const { notifications, notificationsReadAt, markNotificationsRead, me } = useAdmin();
  const [open, setOpen] = useState(false);
  const [mountedAt] = useState(() => Date.now());
  // The "new" line while the popover is open: the marker as it was when it opened.
  const [highlightAfter, setHighlightAfter] = useState<number | null>(null);

  const seenAt = notificationsReadAt ? new Date(notificationsReadAt).getTime() : mountedAt - FIRST_VISIT_WINDOW_MS;
  const unread = notifications.filter((n) => new Date(n.createdAt).getTime() > seenAt).length;

  // A row that appears after the page loaded is announced once; what was there at load is not.
  const known = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!known.current) {
      known.current = new Set(notifications.map((n) => n.id));
      return;
    }
    for (const n of notifications) {
      if (known.current.has(n.id)) continue;
      known.current.add(n.id);
      if (!open) toast(n.title, { description: n.body || undefined });
    }
  }, [notifications, open]);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setHighlightAfter(seenAt);
      if (unread > 0) void markNotificationsRead();
    }
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-11" aria-label={unread > 0 ? `Pranešimai: ${unread} nauji` : "Pranešimai"} title="Pranešimai">
          <BellIcon size={20} />
          {unread > 0 ? (
            <span className="absolute top-1 right-1 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-xs leading-5 font-bold text-primary-foreground tabular-nums">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 border-border p-0 sm:w-96">
        <div className="flex min-h-11 items-center justify-between gap-2 border-b px-4">
          <p className="text-sm font-bold">Pranešimai</p>
          {me.isOwner ? (
            <Link href={NOTIFICATIONS_HREF} onClick={() => setOpen(false)} className="text-xs underline">
              Gavėjai
            </Link>
          ) : null}
        </div>
        {notifications.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Pranešimų kol kas nėra. Nauji rezervacijų, užklausų ir mokėjimų pranešimai atsiras čia.</p>
        ) : (
          <ul>
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} fresh={highlightAfter !== null && new Date(n.createdAt).getTime() > highlightAfter} onOpen={() => setOpen(false)} />
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
