"use client";

import { longDateLabel } from "@/lib/sauna";
import type { RoomTypeId } from "@/lib/cabin";
import { ROOM_TYPES } from "@/lib/cabin";

interface CabinConfirmationProps {
  reference: string;
  checkIn: Date;
  nights: number;
  guests: number;
  roomId: RoomTypeId;
  total: number;
  onReset: () => void;
}

export function CabinConfirmation({ reference, checkIn, nights, guests, roomId, total, onReset }: CabinConfirmationProps) {
  const room = ROOM_TYPES.find((r) => r.id === roomId)!;
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + nights);

  return (
    <div className="border border-ink bg-foam">
      <div className="flex items-center justify-between border-b border-dashed border-ink/30 px-6 py-4">
        <span className="font-display text-lg font-bold">Miegas Marse</span>
        <span className="font-display text-lg font-bold text-rust">{reference}</span>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 px-6 py-6 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-ink/50">Atvykimas</dt>
          <dd className="mt-1 font-medium">{longDateLabel(checkIn)}</dd>
        </div>
        <div>
          <dt className="text-ink/50">Išvykimas</dt>
          <dd className="mt-1 font-medium">{longDateLabel(checkOut)}</dd>
        </div>
        <div>
          <dt className="text-ink/50">Tipas</dt>
          <dd className="mt-1 font-medium">{room.label}</dd>
        </div>
        <div>
          <dt className="text-ink/50">Svečiai</dt>
          <dd className="mt-1 font-medium">{guests} žm.</dd>
        </div>
      </dl>
      <div className="flex items-center justify-between border-t border-dashed border-ink/30 px-6 py-4">
        <p className="text-sm text-ink/70">Rezervacija patvirtinta. Patvirtinimą atsiųsime el. paštu.</p>
        <p className="font-display text-2xl font-bold">{total} €</p>
      </div>
      <div className="border-t border-ink/15 px-6 py-4">
        <button type="button" onClick={onReset} className="text-sm font-medium text-ink/70 underline underline-offset-4 hover:text-rust">
          Rezervuoti kitą nakvynę
        </button>
      </div>
    </div>
  );
}
