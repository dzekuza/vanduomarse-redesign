import { CalendarPlusIcon, CurrencyEurIcon, ProhibitIcon, WarningIcon, type Icon } from "@phosphor-icons/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatAgo } from "@/lib/admin/format";
import type { StaffNotification } from "@/lib/admin/types";

const KIND_ICON: Record<StaffNotification["kind"], Icon> = {
  uzklausa: CalendarPlusIcon,
  mokejimas: CurrencyEurIcon,
  mokejimas_patikrinti: WarningIcon,
  dvigubas: WarningIcon,
  atsaukta: ProhibitIcon,
};

/** Payments that need a person to act get the warning colour. */
const NEEDS_ACTION: StaffNotification["kind"][] = ["mokejimas_patikrinti", "dvigubas"];

interface NotificationItemProps {
  notification: StaffNotification;
  /** Arrived after the bell was last opened. */
  fresh: boolean;
  onOpen: () => void;
}

/** One row of the bell's list: icon, title, details, how long ago; leads to the admin page it is about. */
export function NotificationItem({ notification: n, fresh, onOpen }: NotificationItemProps) {
  const KindIcon = KIND_ICON[n.kind];
  return (
    <li className="border-b last:border-b-0">
      <Link href={n.href} onClick={onOpen} className={cn("flex min-h-11 gap-3 px-4 py-3 outline-none hover:bg-muted focus-visible:bg-muted", fresh && "bg-muted/60")}>
        <KindIcon aria-hidden size={20} className={cn("mt-0.5 shrink-0", NEEDS_ACTION.includes(n.kind) ? "text-destructive" : "text-muted-foreground")} />
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="text-sm font-bold wrap-anywhere">{n.title}</span>
            {fresh ? <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" role="img" aria-label="Nauja" /> : null}
          </span>
          {n.body ? <span className="mt-0.5 block text-xs whitespace-pre-line text-muted-foreground wrap-anywhere">{n.body}</span> : null}
          <time dateTime={n.createdAt} className="mt-1 block text-xs text-muted-foreground tabular-nums">
            {formatAgo(n.createdAt)}
          </time>
        </span>
      </Link>
    </li>
  );
}
