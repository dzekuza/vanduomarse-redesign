import { ConfettiIcon } from "@phosphor-icons/react";
import type { ComponentType } from "react";
import { ACTIVITY_ICON } from "@/components/reservation/activity-icons";
import type { CalendarKind } from "@/lib/admin/calendar-entries";
import { cn } from "@/lib/utils";

/** Pirtis red, Apgyvendinimas dark, Keturračiai light brown (tan), Renginiai pink (a rose pink, apart from the coral of Pirtis). */
const KIND_BG: Record<CalendarKind, string> = {
  pirtis: "bg-rust",
  namelis: "bg-ink",
  keturraciai: "bg-status-new",
  renginys: "bg-calendar-pink",
};

/** Card surface per type: a light wash of the type colour with a stronger border (brown for Keturračiai, whose dot is the lighter tan). */
export const KIND_CARD: Record<CalendarKind, string> = {
  pirtis: "border-rust bg-rust/25",
  namelis: "border-ink bg-ink/15",
  keturraciai: "border-calendar-brown bg-status-new/30",
  renginys: "border-calendar-pink bg-calendar-pink/20",
};

/** Small colour marker shared by the grid, the agenda and the filter chips. */
export function KindDot({ kind, className }: { kind: CalendarKind; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2.5 shrink-0 rounded-full", KIND_BG[kind], className)} />;
}

const KIND_ICON: Record<CalendarKind, ComponentType<{ size?: number; "aria-hidden"?: boolean }>> = {
  pirtis: ACTIVITY_ICON.pirtis,
  namelis: ACTIVITY_ICON.nakvyne,
  keturraciai: ACTIVITY_ICON.keturraciai,
  renginys: ConfettiIcon,
};

/** The colour dot followed by the type's icon (same icons as the public /rezervacija activity tabs). */
export function KindMark({ kind, className }: { kind: CalendarKind; className?: string }) {
  const Icon = KIND_ICON[kind];
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <KindDot kind={kind} />
      <Icon size={14} aria-hidden />
    </span>
  );
}
