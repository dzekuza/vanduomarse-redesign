"use client";

import { useState } from "react";
import { Stepper } from "@/components/booking/stepper";
import { TextCtaArrow, ctaClass } from "@/components/cta";
import { MAX_PEOPLE, type SessionRow } from "@/lib/reservation";

interface SessionListProps {
  rows: SessionRow[];
  emptyMessage: string;
  people: number;
  selected: (row: SessionRow) => boolean;
  onPeople: (people: number) => void;
  onSelect: (row: SessionRow, people: number) => void;
  /** Rows shown before "Rodyti visus". */
  limit?: number;
}

/** The chosen day's sessions as event cards, with a selection action on each available row. */
export function SessionList({ rows, emptyMessage, people, selected, onPeople, onSelect, limit = 8 }: SessionListProps) {
  const [all, setAll] = useState(false);
  if (rows.length === 0) {
    return <p role="status" className="text-sm text-rust-ink">{emptyMessage}</p>;
  }
  const shown = all ? rows : rows.filter((row, index) => index < limit || selected(row));
  return (
    <div>
      <ul role="list" className="grid gap-4">
        {shown.map((row) => (
          <li key={row.key}>
            <SessionCard row={row} people={people} selected={selected(row)} onPeople={onPeople} onSelect={onSelect} />
          </li>
        ))}
      </ul>
      {rows.length > limit ? (
        <button type="button" onClick={() => setAll(!all)} className="mt-4 inline-flex min-h-11 items-center text-sm text-copy underline underline-offset-4 hover:text-ink">
          {all ? "Rodyti mažiau" : `Rodyti visus seansus (${rows.length})`}
        </button>
      ) : null}
    </div>
  );
}

function SessionCard({ row, people, selected, onPeople, onSelect }: Pick<SessionListProps, "people" | "onPeople" | "onSelect"> & { row: SessionRow; selected: boolean }) {
  const [draftPeople, setDraftPeople] = useState<number>();
  const max = Math.min(MAX_PEOPLE, row.maxPeople);
  const count = selected ? people : Math.min(draftPeople ?? people, max);
  const active = selected && !row.blocked;
  const line = active ? "border-line-on-ink" : "border-line";
  const copy = active ? "text-dust/80" : "text-copy";

  return (
    <article
      aria-label={`${row.title}, ${row.time}`}
      className={`grid gap-x-5 gap-y-4 border p-5 transition-colors duration-150 ease-out-strong lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center ${
        active ? "border-ink bg-ink text-dust" : "border-line bg-card"
      } ${row.blocked ? "cursor-not-allowed text-copy" : ""}`}
    >
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className={`inline-block border px-2 py-0.5 text-micro uppercase ${line}`}>{row.label}</span>
          <span className={`text-xs ${copy}`}>{row.time}</span>
        </span>
        <span className="mt-2 block text-item font-bold">{row.title}</span>
        {row.description ? <span className={`mt-1 block max-w-xl text-xs leading-relaxed ${copy}`}>{row.description}</span> : null}
        <span className={`mt-2 block text-xs ${!active && (row.blocked || row.mode === "session") ? "text-rust-ink" : copy}`}>{row.seats}</span>
      </span>
      {row.blocked ? null : (
        <div className={`border-t pt-3 lg:border-0 lg:pt-0 ${line}`}>
          <Stepper
            label="Kiekis"
            value={count}
            onChange={(next) => (selected ? onPeople : setDraftPeople)(Math.min(next, max))}
            min={1}
            max={max}
            editable
            compact
          />
        </div>
      )}
      <span className={`flex flex-wrap items-center justify-between gap-3 border-t pt-4 lg:col-start-3 lg:flex-col lg:items-end lg:border-0 lg:pt-0 lg:text-right ${line}`}>
        <span className="max-w-56 text-item font-bold sm:text-figure">{row.rate}</span>
        {row.blocked ? (
          <span className="text-xs text-copy">Nepasiekiama</span>
        ) : (
          <button
            type="button"
            aria-pressed={active}
            aria-label={`${active ? "Pasirinkta" : "Pasirinkti"}: ${row.title}, ${row.time}`}
            onClick={active ? undefined : () => onSelect(row, count)}
            className={ctaClass({ tone: active ? "cream" : "dark", small: true, className: "inline-flex items-center" })}
          >
            {active ? "Pasirinkta" : "Pasirinkti"}
            <TextCtaArrow />
          </button>
        )}
      </span>
    </article>
  );
}
