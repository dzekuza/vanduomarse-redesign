"use client";

import { longDateLabel } from "@/lib/sauna";

interface ConfirmationProps {
  reference: string;
  date: Date;
  time: string;
  partySize: number;
  vihtas: number;
  total: number;
  onReset: () => void;
}

export function Confirmation({ reference, date, time, partySize, vihtas, total, onReset }: ConfirmationProps) {
  return (
    <div className="border border-ink bg-foam">
      <div className="flex items-center justify-between border-b border-dashed border-ink/30 px-6 py-4">
        <span className="font-display text-lg font-bold">Pirtis Marse</span>
        <span className="font-display text-lg font-bold text-rust">{reference}</span>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 px-6 py-6 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-ink/50">Data</dt>
          <dd className="mt-1 font-medium">{longDateLabel(date)}</dd>
        </div>
        <div>
          <dt className="text-ink/50">Laikas</dt>
          <dd className="mt-1 font-medium">{time}, 90 min</dd>
        </div>
        <div>
          <dt className="text-ink/50">Grupė</dt>
          <dd className="mt-1 font-medium">{partySize} žm.</dd>
        </div>
        <div>
          <dt className="text-ink/50">Vantos</dt>
          <dd className="mt-1 font-medium">{vihtas || "-"}</dd>
        </div>
      </dl>
      <div className="flex items-center justify-between border-t border-dashed border-ink/30 px-6 py-4">
        <p className="text-sm text-ink/70">Rezervacija patvirtinta. Patvirtinimą atsiųsime el. paštu.</p>
        <p className="font-display text-2xl font-bold">{total} €</p>
      </div>
      <div className="border-t border-ink/15 px-6 py-4">
        <button type="button" onClick={onReset} className="text-sm font-medium text-ink/70 underline underline-offset-4 hover:text-rust">
          Rezervuoti kitą seansą
        </button>
      </div>
    </div>
  );
}
