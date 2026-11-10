"use client";

import { CalendarBlankIcon, CalendarPlusIcon, FireIcon, PlusIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";

/** What the day menu can start on a given day. */
export type DayAction = "booking" | "seansas" | "renginys";

interface DayMenuProps {
  day: string;
  onSelect: (day: string) => void;
  onCreate: (action: DayAction, day: string) => void;
  /** One element; it becomes the right-click / long-press target. */
  children: ReactNode;
}

/** Quick actions for a day, shared by the month cell, the week column and the day view (same idea as the sauna calendar's cell menu). */
export function DayMenu({ day, onSelect, onCreate, children }: DayMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => onCreate("booking", day)}>
          <PlusIcon /> Nauja rezervacija šią dieną
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => onCreate("seansas", day)}>
          <FireIcon /> Naujas pirties seansas
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => onCreate("renginys", day)}>
          <CalendarPlusIcon /> Naujas renginys
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => onSelect(day)}>
          <CalendarBlankIcon /> Pasirinkti dieną
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
