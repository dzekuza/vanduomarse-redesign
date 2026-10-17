"use client";

import { ROOM_TYPES, type RoomTypeId } from "@/lib/cabin";

export function RoomTypePicker({ selected, onSelect }: { selected: RoomTypeId; onSelect: (id: RoomTypeId) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {ROOM_TYPES.map((room) => {
        const active = selected === room.id;
        return (
          <button
            key={room.id}
            type="button"
            onClick={() => onSelect(room.id)}
            aria-pressed={active}
            className={`flex items-center justify-between border px-4 py-4 text-left transition-[color,background-color,border-color,transform] active:scale-[0.98] ${
              active ? "border-rust bg-rust text-foam" : "border-ink/15 text-ink hover:border-ink/40"
            }`}
          >
            <div>
              <p className="font-medium">{room.label}</p>
              <p className={active ? "text-foam/70" : "text-ink/50"}>{room.note}</p>
            </div>
            <p className="font-display text-xl font-bold">{room.pricePerNight} €</p>
          </button>
        );
      })}
    </div>
  );
}
