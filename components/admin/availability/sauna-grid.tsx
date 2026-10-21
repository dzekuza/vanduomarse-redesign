"use client";

import { LockSimpleIcon, PlusIcon } from "@phosphor-icons/react";
import { useAdmin } from "../admin-store";
import { saunaBookingAt } from "@/lib/admin/occupancy";
import { formatDay } from "@/lib/admin/format";
import { formatHour } from "@/lib/sauna";

interface SaunaGridProps {
  days: string[];
  onOpenBooking: (id: string) => void;
}

/** Hour-by-day sauna grid: booked, closed by staff, or free (click to close). */
export function SaunaGrid({ days, onOpenBooking }: SaunaGridProps) {
  const { bookings, blocks, saunaRates, toggleBlock } = useAdmin();
  const hours = Array.from({ length: saunaRates.closeHour - saunaRates.openHour }, (_, i) => saunaRates.openHour + i);
  const cols = days.length === 1 ? "grid-cols-[4rem_minmax(0,1fr)]" : "grid-cols-[4rem_repeat(7,minmax(0,1fr))]";

  return (
    <div className={`grid ${cols} border-l border-t text-xs`}>
      <div className="border-r border-b bg-muted" />
      {days.map((d) => (
        <div key={d} className="border-r border-b bg-muted px-2 py-2 font-medium">{formatDay(d)}</div>
      ))}
      {hours.map((hour) => (
        <div key={hour} className="contents">
          <div className="flex items-start justify-end border-r border-b px-2 py-2 text-muted-foreground tabular-nums">{formatHour(hour)}</div>
          {days.map((day) => {
            const booking = saunaBookingAt(bookings, day, hour);
            const blocked = blocks.find((b) => b.date === day && b.hour === hour);
            if (booking) {
              const first = booking.startHour === hour;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => onOpenBooking(booking.id)}
                  className={`min-h-11 border-r border-b px-2 py-1 text-left ${booking.status === "laukia" ? "bg-rust/85 text-foam" : "bg-ink text-foam"} hover:opacity-90`}
                >
                  {first ? (
                    <>
                      <span className="block truncate font-medium">{booking.customer.name}</span>
                      <span className="block truncate opacity-75">{booking.guests} asm.</span>
                    </>
                  ) : (
                    <span className="sr-only">{booking.customer.name}</span>
                  )}
                </button>
              );
            }
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleBlock(day, hour)}
                aria-label={`${blocked ? "Atidaryti" : "Uždaryti"} ${formatDay(day)} ${formatHour(hour)}`}
                className={`group flex min-h-11 items-center justify-center border-r border-b ${
                  blocked ? "bg-hatch text-rust" : "hover:bg-muted"
                }`}
              >
                {blocked ? <LockSimpleIcon size={16} /> : <PlusIcon size={14} className="opacity-0 group-hover:opacity-50 group-focus-visible:opacity-50" />}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
