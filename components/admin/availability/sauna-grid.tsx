"use client";

import { CheckSquareIcon, LockSimpleIcon, LockSimpleOpenIcon, PencilSimpleIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useAdmin } from "../admin-store";
import { SESSION_SAUNA_ID, saunaBookingAt, saunaSessionAt, saunaSlice } from "@/lib/admin/occupancy";
import { formatDay } from "@/lib/admin/format";
import { formatHour, type Sauna } from "@/lib/sauna";
import { Button } from "@/components/ui/button";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { cn } from "cn";

interface SaunaGridProps {
  sauna: Sauna;
  days: string[];
  onOpenBooking: (id: string) => void;
  /** Opens a public session (the main sauna only). */
  onOpenEvent?: (id: string) => void;
  onCreateBooking: (day: string, hour: number) => void;
}

const cellKey = (day: string, hour: number) => `${day}_${hour}`;

/** Hour-by-day grid for one sauna: booked, closed by staff, or free. Click a free cell to start a booking; right-click for more (edit, select, close); with cells selected, bulk-close or bulk-reopen them. */
export function SaunaGrid({ sauna, days, onOpenBooking, onOpenEvent, onCreateBooking }: SaunaGridProps) {
  const admin = useAdmin();
  const { bookings, blocks } = saunaSlice(admin.bookings, admin.blocks, sauna.id);
  const { openHour, closeHour } = sauna.rates;
  const sessionsHere = sauna.id === SESSION_SAUNA_ID;
  const hours = Array.from({ length: closeHour - openHour }, (_, i) => openHour + i);
  const cols = days.length === 1 ? "grid-cols-[4rem_minmax(0,1fr)]" : "grid-cols-[4rem_repeat(7,minmax(0,1fr))]";
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelected = (key: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const clearSelected = () => setSelected(new Set());

  const selectedCells = [...selected]
    .map((key) => {
      const [day, hourStr] = key.split("_");
      const hour = Number(hourStr);
      return { key, day, hour, blocked: blocks.some((b) => b.date === day && b.hour === hour) };
    })
    .filter((c) => !saunaBookingAt(bookings, c.day, c.hour) && !(sessionsHere && saunaSessionAt(admin.events, admin.programs, c.day, c.hour)));

  const bulkClose = () => {
    selectedCells.filter((c) => !c.blocked).forEach((c) => admin.toggleBlock(sauna.id, c.day, c.hour));
    clearSelected();
  };
  const bulkOpen = () => {
    selectedCells.filter((c) => c.blocked).forEach((c) => admin.toggleBlock(sauna.id, c.day, c.hour));
    clearSelected();
  };

  return (
    <div className="space-y-2">
      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted px-3 py-2 text-xs">
          <span className="font-normal">Pažymėta langelių: {selected.size}</span>
          <Button type="button" size="sm" variant="outline" className="h-7" onClick={bulkClose}>
            <LockSimpleIcon size={14} /> Padaryti neprieinamus
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7" onClick={bulkOpen}>
            <LockSimpleOpenIcon size={14} /> Atidaryti
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-7" onClick={clearSelected}>
            <XIcon size={14} /> Atžymėti
          </Button>
        </div>
      ) : null}
      <div className={`grid ${cols} border-l border-t text-xs`}>
        <div className="border-r border-b bg-muted" />
        {days.map((d) => (
          <div key={d} className="border-r border-b bg-muted px-2 py-2 font-normal">{formatDay(d)}</div>
        ))}
        {hours.map((hour) => (
          <div key={hour} className="contents">
            <div className="flex items-start justify-end border-r border-b px-2 py-2 text-muted-foreground tabular-nums">{formatHour(hour)}</div>
            {days.map((day) => {
              const booking = saunaBookingAt(bookings, day, hour);
              const blocked = blocks.find((b) => b.date === day && b.hour === hour);
              const session = !booking && sessionsHere ? saunaSessionAt(admin.events, admin.programs, day, hour) : undefined;
              const key = cellKey(day, hour);
              const isSelected = selected.has(key);

              if (booking) {
                const first = booking.startHour === hour;
                return (
                  <ContextMenu key={day}>
                    <ContextMenuTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onOpenBooking(booking.id)}
                        className={`min-h-11 border-r border-b px-2 py-1 text-left ${booking.status === "laukia" ? "bg-rust/85 text-foam" : "bg-ink text-foam"} hover:opacity-90`}
                      >
                        {first ? (
                          <>
                            <span className="block truncate font-normal">{booking.customer.name}</span>
                            <span className="block truncate opacity-75">{booking.guests} asm.</span>
                          </>
                        ) : (
                          <span className="sr-only">{booking.customer.name}</span>
                        )}
                      </button>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onSelect={() => onOpenBooking(booking.id)}>
                        <PencilSimpleIcon /> Redaguoti rezervaciją
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              }

              if (session) {
                const first = hour === Math.floor(Number(session.time.slice(0, 2)));
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => onOpenEvent?.(session.id)}
                    className="min-h-11 border-r border-b bg-lake px-2 py-1 text-left text-foam hover:opacity-90"
                  >
                    {first ? (
                      <>
                        <span className="block truncate font-normal">{session.title}</span>
                        <span className="block truncate opacity-75">{session.capacity ? `${session.sold + session.held}/${session.capacity}` : session.sold} asm.</span>
                      </>
                    ) : (
                      <span className="sr-only">{session.title}</span>
                    )}
                  </button>
                );
              }

              return (
                <ContextMenu key={day}>
                  <ContextMenuTrigger asChild>
                    <button
                      type="button"
                      onClick={() => (selected.size > 0 ? toggleSelected(key) : onCreateBooking(day, hour))}
                      aria-label={`${formatDay(day)} ${formatHour(hour)}${blocked ? ", neprieinama" : ", laisva"}`}
                      aria-pressed={isSelected}
                      className={cn(
                        "group flex min-h-11 items-center justify-center border-r border-b",
                        isSelected ? "bg-primary/15 ring-1 ring-inset ring-primary" : blocked ? "bg-hatch text-rust" : "hover:bg-muted",
                      )}
                    >
                      {isSelected ? (
                        <CheckSquareIcon size={16} className="text-primary" />
                      ) : blocked ? (
                        <LockSimpleIcon size={16} />
                      ) : (
                        <PlusIcon size={14} className="opacity-0 group-hover:opacity-50 group-focus-visible:opacity-50" />
                      )}
                    </button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    {!blocked ? (
                      <ContextMenuItem onSelect={() => onCreateBooking(day, hour)}>
                        <PlusIcon /> Nauja rezervacija čia
                      </ContextMenuItem>
                    ) : null}
                    <ContextMenuItem onSelect={() => toggleSelected(key)}>
                      <CheckSquareIcon /> {isSelected ? "Atžymėti langelį" : "Pažymėti langelį"}
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onSelect={() => admin.toggleBlock(sauna.id, day, hour)}>
                      {blocked ? <LockSimpleOpenIcon /> : <LockSimpleIcon />}
                      {blocked ? "Atidaryti šį laiką" : "Padaryti neprieinamą"}
                    </ContextMenuItem>
                    {selected.size > 0 ? (
                      <>
                        <ContextMenuSeparator />
                        <ContextMenuItem onSelect={bulkClose}>
                          <LockSimpleIcon /> Pažymėtus ({selected.size}) padaryti neprieinamus
                        </ContextMenuItem>
                        <ContextMenuItem onSelect={bulkOpen}>
                          <LockSimpleOpenIcon /> Pažymėtus ({selected.size}) atidaryti
                        </ContextMenuItem>
                        <ContextMenuItem onSelect={clearSelected}>
                          <XIcon /> Atžymėti viską
                        </ContextMenuItem>
                      </>
                    ) : null}
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
