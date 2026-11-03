"use client";

import { useState } from "react";
import type { SessionRow } from "@/lib/reservation";

interface SessionListProps {
  rows: SessionRow[];
  selected: (row: SessionRow) => boolean;
  onSelect: (row: SessionRow) => void;
  /** Rows shown before "Rodyti visus". */
  limit?: number;
}

const COLUMNS = ["Seansas", "Laikas", "Vietos", "Kaina"];

/** The day's seansai as a timetable: name, time, free seats, price and a radio mark; whole row is the button. */
export function SessionList({ rows, selected, onSelect, limit = 8 }: SessionListProps) {
  const [all, setAll] = useState(false);
  if (rows.length === 0) {
    return <p role="status" className="text-sm text-rust-ink">Šią dieną šiai grupei laisvų seansų nėra. Pakeisk dieną ar žmonių skaičių.</p>;
  }
  const shown = all ? rows : rows.slice(0, limit);
  return (
    <div>
      <div aria-hidden className="hidden gap-4 px-5 pb-3 text-micro uppercase text-ink/70 md:grid md:grid-cols-12">
        <span className="col-span-5">{COLUMNS[0]}</span>
        <span className="col-span-2">{COLUMNS[1]}</span>
        <span className="col-span-2">{COLUMNS[2]}</span>
        <span className="col-span-2">{COLUMNS[3]}</span>
      </div>
      <ul className="space-y-2">
        {shown.map((row) => {
          const on = selected(row);
          return (
            <li key={row.key}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onSelect(row)}
                disabled={row.blocked}
                className={`grid w-full min-h-11 gap-2 border p-4 text-left transition-[color,background-color,border-color,scale] duration-150 ease-out-strong motion-safe:active:scale-99 md:grid-cols-12 md:items-center md:gap-4 md:px-5 ${
                  row.blocked ? "cursor-not-allowed border-line text-ink/35" : on ? "border-ink bg-ink text-dust" : "border-line hover:border-ink"
                }`}
              >
                <span className="min-w-0 md:col-span-5">
                  <span className={`inline-block border px-2 py-0.5 text-micro uppercase ${on ? "border-line-on-ink" : "border-line"}`}>{row.label}</span>
                  <span className="mt-2 block text-item font-bold">{row.title}</span>
                  <span className={`block text-xs line-clamp-1 ${on ? "text-dust/75" : "text-ink/65"}`}>{row.description}</span>
                </span>
                <span className="text-sm font-bold md:col-span-2">{row.time}</span>
                <span className={`text-xs md:col-span-2 ${on ? "text-dust/80" : "text-ink/70"}`}>{row.seats}</span>
                <span className="flex items-center justify-between gap-3 text-xs font-bold md:col-span-3 md:justify-between">
                  {row.rate}
                  <span aria-hidden className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${on ? "border-rust" : "border-line"}`}>
                    {on ? <span className="size-3 rounded-full bg-rust" /> : null}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {rows.length > limit ? (
        <button type="button" onClick={() => setAll(!all)} className="mt-4 inline-flex min-h-11 items-center text-sm text-ink/70 underline underline-offset-4 hover:text-rust">
          {all ? "Rodyti mažiau" : `Rodyti visus seansus (${rows.length})`}
        </button>
      ) : null}
    </div>
  );
}
