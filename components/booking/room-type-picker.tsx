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
            className={`flex items-center justify-between border px-4 py-4 text-left transition-[color,background-color,border-color,scale] duration-150 ease-out-strong motion-safe:active:scale-98 ${
              active ? "border-ink bg-ink text-foam" : "border-ink text-ink hover:border-rust"
            }`}
          >
            <div>
              <p className="font-medium">{room.label}</p>
              <p className={active ? "text-foam/70" : "text-ink/50"}>{room.note}</p>
            </div>
            <p className="font-display text-xl font-bold">
              {room.id === "namelis" && <span className="font-sans text-sm font-normal normal-case">nuo </span>}
              {room.pricePerNight} €
            </p>
          </button>
        );
      })}
    </div>
  );
}
