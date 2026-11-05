"use client";

import { useState } from "react";
import { Stepper } from "@/components/booking/stepper";
import { TextCtaArrow, ctaClass } from "@/components/cta";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MAX_PEOPLE, type SessionRow } from "@/lib/reservation";
import { formatHour } from "@/lib/sauna";

interface SessionListProps {
  rows: SessionRow[];
  emptyMessage: string;
  people: number;
  selected: (row: SessionRow) => boolean;
  selectedStart: number | null;
  onPeople: (people: number) => void;
  onSelect: (row: SessionRow, people: number, startHour: number | null) => void;
  onRemove: () => void;
  /** Public sessions shown before "Rodyti visus". Private programs are always shown. */
  limit?: number;
}

/** Scheduled sessions first, followed by one card for each private program. */
export function SessionList({ rows, emptyMessage, people, selected, selectedStart, onPeople, onSelect, onRemove, limit = 8 }: SessionListProps) {
  const [all, setAll] = useState(false);
  if (rows.length === 0) {
    return <p role="status" className="text-sm text-rust-ink">{emptyMessage}</p>;
  }
  const sessions = rows.filter((row) => row.mode === "session");
  const programs = rows.filter((row) => row.mode === "private");
  const shown = all ? sessions : sessions.filter((row, index) => index < limit || selected(row));
  const renderCard = (row: SessionRow) => (
    <li key={row.key}>
      <SessionCard row={row} people={people} selected={selected(row)} selectedStart={selectedStart} onPeople={onPeople} onSelect={onSelect} onRemove={onRemove} />
    </li>
  );
  return (
    <div className="space-y-4">
      {shown.length > 0 && <ul role="list" aria-label="Seansai" className="grid gap-4">{shown.map(renderCard)}</ul>}
      {sessions.length > limit ? (
        <button type="button" aria-expanded={all} onClick={() => setAll(!all)} className="inline-flex min-h-11 items-center text-sm text-copy underline underline-offset-4 hover:text-ink">
          {all ? "Rodyti mažiau" : `Rodyti visus seansus (${sessions.length})`}
        </button>
      ) : null}
      {programs.length > 0 && <ul role="list" aria-label="Privačios pirtys" className="grid gap-4">{programs.map(renderCard)}</ul>}
    </div>
  );
}

function SessionCard({ row, people, selected, selectedStart, onPeople, onSelect, onRemove }: Pick<SessionListProps, "people" | "selectedStart" | "onPeople" | "onSelect" | "onRemove"> & { row: SessionRow; selected: boolean }) {
  const [draftPeople, setDraftPeople] = useState<number>();
  const [draftStart, setDraftStart] = useState<number | null>(null);
  const isPrivate = row.mode === "private";
  const startHours = row.startHours ?? [];
  const candidate = selected ? selectedStart : draftStart;
  const startHour = candidate !== null && startHours.includes(candidate) ? candidate : null;
  const blocked = row.blocked || (isPrivate && startHours.length === 0);
  const ready = !isPrivate || startHour !== null;
  const max = Math.min(MAX_PEOPLE, row.maxPeople);
  const count = isPrivate ? 1 : selected ? people : Math.min(draftPeople ?? people, max);
  const active = selected && !blocked;
  const line = active ? "border-line-on-ink" : "border-line";
  const copy = active ? "text-dust/80" : "text-copy";
  const action = selected ? "Pašalinti iš plano" : "Pasirinkti";

  return (
    <article
      aria-label={`${row.title}, ${row.time}`}
      className={`grid gap-x-5 gap-y-4 border p-5 transition-colors duration-150 ease-out-strong lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center ${
        active ? "border-ink bg-ink text-dust" : "border-line bg-card"
      } ${blocked ? "cursor-not-allowed text-copy" : ""}`}
    >
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className={`inline-block border px-2 py-0.5 text-micro uppercase ${line}`}>{row.label}</span>
          <span className={`text-xs ${copy}`}>{row.time}</span>
        </span>
        <span className="mt-2 block text-item font-bold">{row.title}</span>
        {row.host ? <span className={`mt-1 block text-xs font-bold ${copy}`}>Pirtininkas · {row.host}</span> : null}
        {row.description ? <span className={`mt-1 block max-w-xl text-xs leading-relaxed ${copy}`}>{row.description}</span> : null}
        <span className={`mt-2 block text-xs ${!active && (blocked || row.mode === "session") ? "text-rust-ink" : copy}`}>{row.seats}</span>
      </span>
      {blocked ? null : (
        <div className={`flex flex-wrap items-start gap-3 border-t pt-3 lg:flex-col lg:border-0 lg:pt-0 ${line}`}>
          {isPrivate ? (
            <div className="grid gap-1">
              <span className="text-micro uppercase">Pradžios laikas</span>
              <Select value={startHour === null ? "" : String(startHour)} onValueChange={(value) => {
                const next = Number(value);
                if (selected) onSelect(row, count, next);
                else setDraftStart(next);
              }}>
                <SelectTrigger aria-label={`Pradžios laikas: ${row.title}`} className={`w-full rounded-none ${active ? "border-line-on-ink bg-ink text-dust data-placeholder:text-dust/80 [&>svg]:text-dust/80" : "border-line bg-transparent"}`}>
                  <SelectValue placeholder="Pasirink laiką" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {startHours.map((hour) => <SelectItem key={hour} value={String(hour)} className="min-h-11">{formatHour(hour)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <Stepper
              label="Kiekis"
              value={count}
              onChange={(next) => (selected ? onPeople : setDraftPeople)(Math.min(next, max))}
              min={1}
              max={max}
              editable
              compact
            />
          )}
        </div>
      )}
      <span className={`flex flex-wrap items-center justify-between gap-3 border-t pt-4 lg:col-start-3 lg:flex-col lg:items-end lg:border-0 lg:pt-0 lg:text-right ${line}`}>
        <span className="max-w-56 text-item font-bold sm:text-figure">{row.rate}</span>
        {blocked && <span className="text-xs text-copy">Nepasiekiama</span>}
        {(selected || !blocked) && (
          <button
            type="button"
            aria-label={`${action}: ${row.title}, ${row.time}`}
            disabled={!selected && !ready}
            onClick={selected ? onRemove : () => onSelect(row, count, startHour)}
            className={ctaClass({ tone: active ? "cream" : "dark", small: true, className: "inline-flex items-center disabled:pointer-events-none disabled:opacity-50" })}
          >
            {action}
            {selected ? null : <TextCtaArrow />}
          </button>
        )}
      </span>
    </article>
  );
}
